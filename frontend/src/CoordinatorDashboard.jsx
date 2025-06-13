import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Phone,
  Mail,
  Navigation,
  Award,
  TrendingUp,
  Timer,
  Shield,
  Bell,
  Settings,
  LogOut,
  RefreshCw,
  Star,
  Calendar,
  Filter,
  Search,
  MessageSquare,
  Heart,
  Zap,
  Target,
  Globe,
  Camera,
  Download,
  Share2,
  BarChart3,
  TrendingDown,
  AlertCircle,
  Eye,
  Edit,
  Save,
  X,
  Plus,
  MapIcon,
  Send,
  Archive,
  Trash2,
  UserCheck,
  UserX,
  Clock4,
  CheckSquare,
  FileText,
  Radio,
  Wifi,
  WifiOff,
  Battery,
  Signal,
} from "lucide-react";

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("operations");
  const [operations, setOperations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showCreateOperation, setShowCreateOperation] = useState(false);
  const [showCommunication, setShowCommunication] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalOperations: 0,
    activeOperations: 0,
    completedOperations: 0,
    availableVolunteers: 0,
    totalVolunteers: 0,
    avgResponseTime: 0,
  });

  const [newOperation, setNewOperation] = useState({
    title: "",
    description: "",
    location: { name: "", coordinates: [0, 0] },
    priority: "medium",
    estimatedDuration: 60,
    teamSize: 1,
    requiredSkills: [],
    equipment: [],
    weatherConditions: "",
    riskLevel: "low",
  });

  const [newMessage, setNewMessage] = useState({
    operationId: "",
    message: "",
    type: "update",
    priority: "normal",
  });

  // WebSocket refs and state
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const isConnectingRef = useRef(false);
  const [wsStatus, setWsStatus] = useState("disconnected");

  const MAX_RETRIES = 3;
  const API_BASE_URL = "http://localhost:3000";
  const WS_URL = "ws://localhost:3000";

  // Cleanup function for WebSocket
  const cleanupWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;

      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    isConnectingRef.current = false;
  }, []);

  // Handle real-time updates
  const handleRealTimeUpdate = useCallback((data) => {
    try {
      switch (data.type) {
        case "OPERATION_UPDATE":
          setOperations((prev) =>
            prev.map((op) =>
              op._id === data.operationId ? { ...op, ...data.updates } : op
            )
          );
          break;
        case "VOLUNTEER_STATUS":
          setVolunteers((prev) =>
            prev.map((vol) =>
              vol._id === data.volunteerId ? { ...vol, ...data.updates } : vol
            )
          );
          break;
        case "NEW_NOTIFICATION":
          setNotifications((prev) => [data.notification, ...prev.slice(0, 9)]);
          break;
        default:
          console.log("Unknown message type:", data.type);
          break;
      }
    } catch (err) {
      console.error("Error handling real-time update:", err);
    }
  }, []);

  // Connect WebSocket with proper error handling
  const connectWebSocket = useCallback(() => {
    if (isConnectingRef.current || !realTimeUpdates) {
      return;
    }

    if (retryCountRef.current >= MAX_RETRIES) {
      console.log("Max WebSocket retry attempts reached");
      setWsStatus("failed");
      return;
    }

    cleanupWebSocket();

    isConnectingRef.current = true;
    setWsStatus("connecting");

    // Add a 1-second delay for the first attempt
    const delay = retryCountRef.current === 0 ? 1000 : 0;
    setTimeout(() => {
      console.log(
        `Attempting WebSocket connection to ${WS_URL} (attempt ${
          retryCountRef.current + 1
        })`
      );

      try {
        const websocket = new WebSocket(WS_URL);
        wsRef.current = websocket;

        websocket.onopen = () => {
          console.log("WebSocket connected successfully");
          setWsStatus("connected");
          retryCountRef.current = 0;
          isConnectingRef.current = false;
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleRealTimeUpdate(data);
          } catch (err) {
            console.error("WebSocket message parsing error:", err);
          }
        };

        websocket.onclose = (event) => {
          console.log(
            `WebSocket disconnected. Code: ${event.code}, Reason: ${
              event.reason || "No reason provided"
            }`
          );
          isConnectingRef.current = false;

          if (wsRef.current === websocket) {
            wsRef.current = null;
            setWsStatus("disconnected");

            if (realTimeUpdates && retryCountRef.current < MAX_RETRIES) {
              const delay = Math.min(
                1000 * Math.pow(2, retryCountRef.current),
                30000
              );
              console.log(`Scheduling WebSocket reconnect in ${delay}ms...`);

              reconnectTimeoutRef.current = setTimeout(() => {
                retryCountRef.current += 1;
                connectWebSocket();
              }, delay);
            }
          }
        };

        websocket.onerror = (error) => {
          console.error("WebSocket error:", error);
          isConnectingRef.current = false;
          setWsStatus("error");
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        isConnectingRef.current = false;
        setWsStatus("error");
      }
    }, delay);
  }, [realTimeUpdates, cleanupWebSocket, handleRealTimeUpdate]);

  // WebSocket connection management effect
  useEffect(() => {
    if (realTimeUpdates) {
      connectWebSocket();
    } else {
      cleanupWebSocket();
      setWsStatus("disconnected");
    }

    return () => {
      cleanupWebSocket();
    };
  }, [realTimeUpdates, connectWebSocket, cleanupWebSocket]);

  // Reset retry count when real-time updates are toggled
  useEffect(() => {
    retryCountRef.current = 0;
  }, [realTimeUpdates]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token || !user) {
      setError("Please login to access the dashboard");
      navigate("/login");
      setIsLoading(false);
      return;
    }

    if (user.role !== "coordinator") {
      setError("Access denied. Please log in as a coordinator.");
      navigate("/login");
      setIsLoading(false);
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [
        operationsRes,
        volunteersRes,
        communicationsRes,
        reportsRes,
        statsRes,
        notificationsRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/coordinator/operations`, { headers }),
        fetch(`${API_BASE_URL}/api/coordinator/volunteers`, { headers }),
        fetch(`${API_BASE_URL}/api/coordinator/communications`, { headers }),
        fetch(`${API_BASE_URL}/api/coordinator/reports`, { headers }),
        fetch(`${API_BASE_URL}/api/coordinator/stats`, { headers }),
        fetch(`${API_BASE_URL}/api/coordinator/notifications`, { headers }),
      ]);

      if (!operationsRes.ok)
        throw new Error(
          `Operations fetch failed: ${operationsRes.status} ${operationsRes.statusText}`
        );
      if (!volunteersRes.ok)
        throw new Error(
          `Volunteers fetch failed: ${volunteersRes.status} ${volunteersRes.statusText}`
        );
      if (!communicationsRes.ok)
        throw new Error(
          `Communications fetch failed: ${communicationsRes.status} ${communicationsRes.statusText}`
        );
      if (!reportsRes.ok)
        throw new Error(
          `Reports fetch failed: ${reportsRes.status} ${reportsRes.statusText}`
        );
      if (!statsRes.ok)
        throw new Error(
          `Stats fetch failed: ${statsRes.status} ${statsRes.statusText}`
        );
      if (!notificationsRes.ok)
        throw new Error(
          `Notifications fetch failed: ${notificationsRes.status} ${notificationsRes.statusText}`
        );

      const [
        operationsData,
        volunteersData,
        communicationsData,
        reportsData,
        statsData,
        notificationsData,
      ] = await Promise.all([
        operationsRes.json(),
        volunteersRes.json(),
        communicationsRes.json(),
        reportsRes.json(),
        statsRes.json(),
        notificationsRes.json(),
      ]);

      setOperations(operationsData.data || []);
      setVolunteers(volunteersData.data || []);
      setCommunications(communicationsData.data || []);
      setReports(reportsData.data || []);
      setStats(statsData.data || stats);
      setNotifications(notificationsData.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to fetch data: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, API_BASE_URL]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCreateOperation = async () => {
    if (
      !newOperation.title ||
      !newOperation.description ||
      !newOperation.location.name
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/coordinator/operations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newOperation),
        }
      );

      const data = await response.json();

      if (data.success) {
        setOperations([...operations, data.data]);
        setShowCreateOperation(false);
        setNewOperation({
          title: "",
          description: "",
          location: { name: "", coordinates: [0, 0] },
          priority: "medium",
          estimatedDuration: 60,
          teamSize: 1,
          requiredSkills: [],
          equipment: [],
          weatherConditions: "",
          riskLevel: "low",
        });
        setSuccess("Operation created successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to create operation");
      }
    } catch (err) {
      setError("Network error creating operation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOperationStatus = async (operationId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/coordinator/operations/${operationId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setOperations(
          operations.map((op) =>
            op._id === operationId ? { ...op, status: newStatus } : op
          )
        );
        setSuccess(`Operation status updated to ${newStatus}`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update operation status");
      }
    } catch (err) {
      setError("Network error updating operation status");
    }
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedAssignVolunteer = useCallback(
    debounce(async (operationId, volunteerId) => {
      if (!volunteerId) return;

      setIsLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/api/coordinator/operations/${operationId}/assign`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ volunteerIds: [volunteerId] }),
          }
        );

        const data = await response.json();

        if (data.success) {
          setOperations(
            operations.map((op) =>
              op._id === operationId
                ? {
                    ...op,
                    assignedVolunteers: data.data.assignedVolunteers,
                  }
                : op
            )
          );
          setSuccess("Volunteer assigned successfully");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError(data.message || "Failed to assign volunteer");
        }
      } catch (err) {
        setError(`Network error assigning volunteer: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [operations, API_BASE_URL]
  );

  const handleAssignVolunteer = (operationId, volunteerId) => {
    debouncedAssignVolunteer(operationId, volunteerId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.message || !newMessage.operationId) {
      setError("Please fill in all message fields");
      return;
    }

    const operationExists = operations.some(
      (op) => op._id === newMessage.operationId
    );
    if (!operationExists) {
      setError("Selected operation does not exist");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/coordinator/communications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newMessage),
        }
      );

      const data = await response.json();

      if (data.success) {
        setCommunications([data.data, ...communications]);
        setNewMessage({
          operationId: "",
          message: "",
          type: "update",
          priority: "normal",
        });
        setSuccess("Message sent successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to send message");
      }
    } catch (err) {
      setError(`Network error sending message: ${err.message}`);
    }
  };

  const handleGenerateReport = async (operationId, reportType) => {
    const validReportTypes = [
      "operations-summary",
      "volunteer-performance",
      "resource-utilization",
      "monthly-analytics",
    ];
    if (!validReportTypes.includes(reportType)) {
      setError(`Invalid report type: ${reportType}`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/coordinator/reports/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ operationId, reportType }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setReports([data.data, ...reports]);
        setSuccess("Report generated successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to generate report");
      }
    } catch (err) {
      setError("Network error generating report");
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    cleanupWebSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleManualReconnect = () => {
    retryCountRef.current = 0;
    connectWebSocket();
  };

  const filteredOperations = operations.filter((op) => {
    const matchesStatus = statusFilter === "all" || op.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || op.priority === priorityFilter;
    const matchesSearch =
      op.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.location.name.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== "all") {
      const now = new Date();
      const opDate = new Date(op.createdAt);
      const diffDays = Math.floor((now - opDate) / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case "today":
          matchesDate = diffDays === 0;
          break;
        case "week":
          matchesDate = diffDays <= 7;
          break;
        case "month":
          matchesDate = diffDays <= 30;
          break;
        default:
          matchesDate = true;
      }
    }

    return matchesStatus && matchesPriority && matchesSearch && matchesDate;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "active":
        return "text-blue-600 bg-blue-100";
      case "in-progress":
        return "text-purple-600 bg-purple-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getWsStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500 animate-pulse";
      case "error":
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getWsStatusText = (status) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Error";
      case "failed":
        return "Failed";
      default:
        return "Disconnected";
    }
  };

  const StatsCard = ({ title, value, icon: Icon, trend, color = "blue" }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {trend && (
            <p
              className={`text-xs ${
                trend > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend > 0 ? "+" : ""}
              {trend}% from last week
            </p>
          )}
        </div>
        <Icon className={`h-8 w-8 text-${color}-600`} />
      </div>
    </div>
  );

  const EnhancedOperationCard = ({ operation }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-3 h-3 rounded-full ${getPriorityColor(
                operation.priority
              )} animate-pulse`}
            ></div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {operation.title}
            </h3>
            <span
              className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(
                operation.status
              )}`}
            >
              {operation.status.replace("-", " ").toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {operation.description}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedOperation(operation)}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
            aria-label="View operation details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              handleGenerateReport(operation._id, "operations-summary")
            }
            className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
            aria-label="Generate report"
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2 text-blue-500" />
          <span className="font-medium">{operation.location.name}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Timer className="h-4 w-4 mr-2 text-purple-500" />
          <span>
            {Math.floor(operation.estimatedDuration / 60)}h{" "}
            {operation.estimatedDuration % 60}m
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2 text-green-500" />
          <span>Team of {operation.teamSize}</span>
        </div>
        {operation.riskLevel && (
          <div className="flex items-center text-sm text-gray-600">
            <Shield className="h-4 w-4 mr-2 text-orange-500" />
            <span className="capitalize">{operation.riskLevel} Risk</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <select
          onChange={(e) => handleAssignVolunteer(operation._id, e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
          defaultValue=""
          disabled={isLoading}
        >
          <option value="">Assign Volunteer</option>
          {volunteers
            .filter((v) => v.isAvailable)
            .map((v) => (
              <option key={v._id} value={v._id}>
                {v.name}
              </option>
            ))}
        </select>
      </div>

      <div className="flex gap-2">
        <select
          onChange={(e) =>
            handleUpdateOperationStatus(operation._id, e.target.value)
          }
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
          defaultValue={operation.status}
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  );

  const CommunicationPanel = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Send Message
        </h3>
        <div className="space-y-4">
          <select
            value={newMessage.operationId}
            onChange={(e) =>
              setNewMessage({ ...newMessage, operationId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Operation</option>
            {operations.map((op) => (
              <option key={op._id} value={op._id}>
                {op.title}
              </option>
            ))}
          </select>

          <div className="flex gap-4">
            <select
              value={newMessage.type}
              onChange={(e) =>
                setNewMessage({ ...newMessage, type: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="update">Update</option>
              <option value="alert">Alert</option>
              <option value="instruction">Instruction</option>
              <option value="notification">Notification</option>
            </select>

            <select
              value={newMessage.priority}
              onChange={(e) =>
                setNewMessage({ ...newMessage, priority: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <textarea
            value={newMessage.message}
            onChange={(e) =>
              setNewMessage({ ...newMessage, message: e.target.value })
            }
            placeholder="Enter your message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows="4"
          />

          <button
            onClick={handleSendMessage}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            Send Message
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Communications
        </h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {communications.map((comm) => (
            <div
              key={comm._id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-2 py-1 text-xs rounded ${getPriorityColor(
                    comm.priority
                  )} text-white`}
                >
                  {comm.type.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comm.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-800 mb-2">{comm.message}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Operation: {comm.operationTitle || "General"}</span>
                <span>•</span>
                <span>Status: {comm.status || "Sent"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const VolunteerManagementPanel = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Volunteer Management
          </h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
              <UserCheck className="h-4 w-4" />
              Approve All Available
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Add Volunteer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {volunteers.map((volunteer) => (
            <div
              key={volunteer._id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{volunteer.name}</h4>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      volunteer.isAvailable ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      volunteer.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {volunteer.isAvailable ? "Available" : "Busy"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{volunteer.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>{volunteer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {volunteer.location && volunteer.location.coordinates
                      ? `${volunteer.location.coordinates[1]}, ${volunteer.location.coordinates[0]}`
                      : "Location not set"}
                  </span>
                </div>
              </div>

              {volunteer.skills && volunteer.skills.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Award className="h-3 w-3 text-blue-500" />
                    <span className="text-xs font-medium text-gray-700">
                      Skills:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {volunteer.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {volunteer.skills.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{volunteer.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedVolunteer(volunteer)}
                  className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Details
                </button>
                <button className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50">
                  <MessageSquare className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ReportsPanel = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Reports & Analytics
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleGenerateReport(null, "operations-summary")}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <BarChart3 className="h-4 w-4" />
              Generate Operations Summary
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4" />
              Export Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Operations This Month</p>
                <p className="text-2xl font-bold">{stats.totalOperations}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats.totalOperations > 0
                    ? Math.round(
                        (stats.completedOperations / stats.totalOperations) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Avg Response Time</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Active Volunteers</p>
                <p className="text-2xl font-bold">
                  {stats.availableVolunteers}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-200" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Recent Reports</h4>
          {reports.map((report) => (
            <div
              key={report._id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{report.title}</h5>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-blue-600">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {report.description || "No description available"}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Type: {report.type}</span>
                <span>•</span>
                <span>Operations: {report.data?.summary?.length || 0}</span>
                <span>•</span>
                <span>Status: Generated</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const CreateOperationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Create New Operation
            </h3>
            <button
              onClick={() => setShowCreateOperation(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation Title *
              </label>
              <input
                type="text"
                value={newOperation.title}
                onChange={(e) =>
                  setNewOperation({ ...newOperation, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter operation title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={newOperation.description}
                onChange={(e) =>
                  setNewOperation({
                    ...newOperation,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Describe the operation details"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={newOperation.location.name}
                onChange={(e) =>
                  setNewOperation({
                    ...newOperation,
                    location: {
                      ...newOperation.location,
                      name: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter location"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newOperation.priority}
                  onChange={(e) =>
                    setNewOperation({
                      ...newOperation,
                      priority: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Level
                </label>
                <select
                  value={newOperation.riskLevel}
                  onChange={(e) =>
                    setNewOperation({
                      ...newOperation,
                      riskLevel: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={newOperation.estimatedDuration}
                  onChange={(e) =>
                    setNewOperation({
                      ...newOperation,
                      estimatedDuration: parseInt(e.target.value) || 60,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="15"
                  step="15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Size
                </label>
                <input
                  type="number"
                  value={newOperation.teamSize}
                  onChange={(e) =>
                    setNewOperation({
                      ...newOperation,
                      teamSize: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weather Conditions
              </label>
              <input
                type="text"
                value={newOperation.weatherConditions}
                onChange={(e) =>
                  setNewOperation({
                    ...newOperation,
                    weatherConditions: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Clear, Rainy, Windy"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleCreateOperation}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Operation"}
            </button>
            <button
              onClick={() => setShowCreateOperation(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const OperationDetailModal = ({ operation, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {operation.title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Operation Details
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded text-xs ${getStatusColor(
                        operation.status
                      )}`}
                    >
                      {operation.status}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Priority:</span>{" "}
                    <span className="capitalize">{operation.priority}</span>
                  </p>
                  <p>
                    <span className="font-medium">Location:</span>{" "}
                    {operation.location.name}
                  </p>
                  <p>
                    <span className="font-medium">Duration:</span>{" "}
                    {Math.floor(operation.estimatedDuration / 60)}h{" "}
                    {operation.estimatedDuration % 60}m
                  </p>
                  <p>
                    <span className="font-medium">Team Size:</span>{" "}
                    {operation.teamSize}
                  </p>
                  <p>
                    <span className="font-medium">Risk Level:</span>{" "}
                    <span className="capitalize">{operation.riskLevel}</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{operation.description}</p>
              </div>

              {operation.requiredSkills &&
                operation.requiredSkills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {operation.requiredSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Assigned Volunteers
                </h4>
                <div className="space-y-2">
                  {operation.assignedVolunteers &&
                  operation.assignedVolunteers.length > 0 ? (
                    operation.assignedVolunteers.map((volunteer) => (
                      <div
                        key={volunteer.volunteerId || volunteer._id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            volunteer.isAvailable
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <span className="text-sm">
                          {volunteer.volunteerId?.name ||
                            volunteer.name ||
                            "Unknown"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No volunteers assigned
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(operation.createdAt).toLocaleString()}
                  </p>
                  {operation.startedAt && (
                    <p>
                      <span className="font-medium">Started:</span>{" "}
                      {new Date(operation.startedAt).toLocaleString()}
                    </p>
                  )}
                  {operation.completedAt && (
                    <p>
                      <span className="font-medium">Completed:</span>{" "}
                      {new Date(operation.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {operation.equipment && operation.equipment.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Equipment</h4>
                  <div className="space-y-1">
                    {operation.equipment.map((item, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {operation.weatherConditions && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Weather Conditions
                  </h4>
                  <p className="text-sm text-gray-600">
                    {operation.weatherConditions}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() =>
                handleGenerateReport(operation._id, "operations-summary")
              }
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Generate Report
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const VolunteerDetailModal = ({ volunteer, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {volunteer.name}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Details</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      volunteer.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {volunteer.isAvailable ? "Available" : "Busy"}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Email:</span> {volunteer.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {volunteer.phone || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Location:</span>{" "}
                  {volunteer.location && volunteer.location.coordinates
                    ? `${volunteer.location.coordinates[1]}, ${volunteer.location.coordinates[0]}`
                    : "Not set"}
                </p>
              </div>
            </div>

            {volunteer.skills && volunteer.skills.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {volunteer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {volunteer.assignedOperations &&
              volunteer.assignedOperations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Assigned Operations
                  </h4>
                  <div className="space-y-2">
                    {volunteer.assignedOperations.map((op) => (
                      <div
                        key={op._id}
                        className="p-2 bg-gray-50 rounded flex items-center justify-between"
                      >
                        <span className="text-sm">{op.title}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getStatusColor(
                            op.status
                          )}`}
                        >
                          {op.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Operations Completed:</span>{" "}
                  {volunteer.completedOperations || 0}
                </p>
                <p>
                  <span className="font-medium">Average Rating:</span>{" "}
                  {volunteer.rating || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Last Active:</span>{" "}
                  {volunteer.lastActive
                    ? new Date(volunteer.lastActive).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Coordinator Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${getWsStatusColor(wsStatus)}`}
              ></div>
              <span className="text-sm text-gray-600">
                {getWsStatusText(wsStatus)}
              </span>
              {(wsStatus === "error" || wsStatus === "failed") && (
                <button
                  onClick={handleManualReconnect}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Reconnect
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={realTimeUpdates}
                onChange={() => setRealTimeUpdates(!realTimeUpdates)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              Real-Time Updates
            </label>

            <button
              onClick={() => setShowCreateOperation(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Operation
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Operations"
            value={stats.totalOperations}
            icon={Activity}
            trend={5}
            color="blue"
          />
          <StatsCard
            title="Active Operations"
            value={stats.activeOperations}
            icon={Target}
            trend={-2}
            color="purple"
          />
          <StatsCard
            title="Available Volunteers"
            value={stats.availableVolunteers}
            icon={Users}
            trend={3}
            color="green"
          />
          <StatsCard
            title="Avg Response Time"
            value={`${stats.avgResponseTime}m`}
            icon={Clock}
            trend={-1}
            color="orange"
          />
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex border-b border-gray-200">
            {[
              { id: "operations", label: "Operations", icon: MapPin },
              { id: "volunteers", label: "Volunteers", icon: Users },
              {
                id: "communications",
                label: "Communications",
                icon: MessageSquare,
              },
              { id: "reports", label: "Reports", icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-blue-600"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Operations Tab */}
        {activeTab === "operations" && (
          <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search operations by title or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : filteredOperations.length === 0 ? (
              <div className="text-center py-10">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No operations found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOperations.map((operation) => (
                  <EnhancedOperationCard
                    key={operation._id}
                    operation={operation}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Volunteers Tab */}
        {activeTab === "volunteers" && <VolunteerManagementPanel />}

        {/* Communications Tab */}
        {activeTab === "communications" && <CommunicationPanel />}

        {/* Reports Tab */}
        {activeTab === "reports" && <ReportsPanel />}

        {/* Modals */}
        {showCreateOperation && <CreateOperationModal />}
        {selectedOperation && (
          <OperationDetailModal
            operation={selectedOperation}
            onClose={() => setSelectedOperation(null)}
          />
        )}
        {selectedVolunteer && (
          <VolunteerDetailModal
            volunteer={selectedVolunteer}
            onClose={() => setSelectedVolunteer(null)}
          />
        )}
      </main>
    </div>
  );
};

export default CoordinatorDashboard;
