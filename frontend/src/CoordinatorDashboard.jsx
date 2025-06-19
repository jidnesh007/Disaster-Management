import React, { useState, useEffect, useCallback, useRef, memo } from "react";
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

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

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
    location: {
      name: "",
      address: "",
      coordinates: { latitude: 0, longitude: 0 },
    },
    requester: {
      name: "",
      phone: "",
    },
    type: "",
    category: "",
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

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const isConnectingRef = useRef(false);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const titleInputRef = useRef(null);

  const MAX_RETRIES = 3;
  const API_BASE_URL = "http://localhost:3000";
  const WS_URL = "ws://localhost:3000";

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

  const handleRealTimeUpdate = useCallback((data) => {
    try {
      switch (data.type) {
        case "OPERATION_UPDATE":
          setOperations((prev) => {
            const updated = prev.map((op) =>
              op._id === data.operationId ? { ...op, ...data.updates } : op
            );
            return JSON.stringify(prev) !== JSON.stringify(updated)
              ? updated
              : prev;
          });
          break;
        case "VOLUNTEER_STATUS":
          setVolunteers((prev) => {
            const updated = prev.map((vol) =>
              vol._id === data.volunteerId ? { ...vol, ...data.updates } : vol
            );
            return JSON.stringify(prev) !== JSON.stringify(updated)
              ? updated
              : prev;
          });
          break;
        case "NEW_NOTIFICATION":
          setNotifications((prev) => {
            const updated = [data.notification, ...prev.slice(0, 9)];
            return JSON.stringify(prev) !== JSON.stringify(updated)
              ? updated
              : prev;
          });
          break;
        default:
          console.log("Unknown message type:", data.type);
          break;
      }
    } catch (err) {
      console.error("Error handling real-time update:", err);
    }
  }, []);

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

      setOperations((prev) =>
        JSON.stringify(prev) !== JSON.stringify(operationsData.data || [])
          ? operationsData.data || []
          : prev
      );
      setVolunteers((prev) =>
        JSON.stringify(prev) !== JSON.stringify(volunteersData.data || [])
          ? volunteersData.data || []
          : prev
      );
      setCommunications((prev) =>
        JSON.stringify(prev) !== JSON.stringify(communicationsData.data || [])
          ? communicationsData.data || []
          : prev
      );
      setReports((prev) =>
        JSON.stringify(prev) !== JSON.stringify(reportsData.data || [])
          ? reportsData.data || []
          : prev
      );
      setStats((prev) =>
        JSON.stringify(prev) !== JSON.stringify(statsData.data || stats)
          ? statsData.data || stats
          : prev
      );
      setNotifications((prev) =>
        JSON.stringify(prev) !== JSON.stringify(notificationsData.data || [])
          ? notificationsData.data || []
          : prev
      );
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

  const handleCreateOperation = useCallback(async () => {
    const { title, description, location, requester, type, category } =
      newOperation;

    if (
      !title ||
      !description ||
      !location.name ||
      !location.address ||
      !location.coordinates.latitude ||
      !location.coordinates.longitude ||
      !requester.name ||
      !requester.phone ||
      !type ||
      !category
    ) {
      setError(
        "Please fill in all required fields: title, description, location (name, address, coordinates), requester (name, phone), type, and category"
      );
      return;
    }

    const validCategories = ["rescue", "evacuation", "medical", "supply"];
    if (!validCategories.includes(category)) {
      setError(`Category must be one of: ${validCategories.join(", ")}`);
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
        setOperations((prev) => [...prev, data.data]);
        setShowCreateOperation(false);
        setNewOperation({
          title: "",
          description: "",
          location: {
            name: "",
            address: "",
            coordinates: { latitude: 0, longitude: 0 },
          },
          requester: {
            name: "",
            phone: "",
          },
          type: "",
          category: "",
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
  }, [newOperation, API_BASE_URL]);

  const handleUpdateOperationStatus = useCallback(
    async (operationId, newStatus) => {
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
          setOperations((prev) =>
            prev.map((op) =>
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
    },
    [API_BASE_URL]
  );

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
          setOperations((prev) =>
            prev.map((op) =>
              op._id === operationId
                ? { ...op, assignedVolunteers: data.data.assignedVolunteers }
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
    [API_BASE_URL]
  );

  const handleAssignVolunteer = useCallback(
    (operationId, volunteerId) => {
      debouncedAssignVolunteer(operationId, volunteerId);
    },
    [debouncedAssignVolunteer]
  );

  const handleSendMessage = useCallback(async () => {
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
        setCommunications((prev) => [data.data, ...prev]);
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
  }, [newMessage, operations, API_BASE_URL]);

  const handleGenerateReport = useCallback(
    async (operationId, reportType) => {
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
          setReports((prev) => [data.data, ...prev]);
          setSuccess("Report generated successfully");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError(data.message || "Failed to generate report");
        }
      } catch (err) {
        setError("Network error generating report");
      }
    },
    [API_BASE_URL]
  );

  const handleLogout = useCallback(async () => {
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
  }, [navigate, cleanupWebSocket, API_BASE_URL]);

  const handleManualReconnect = useCallback(() => {
    retryCountRef.current = 0;
    connectWebSocket();
  }, [connectWebSocket]);

  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  const handleSearchChange = useCallback(
    (e) => {
      debouncedSetSearchTerm(e.target.value);
    },
    [debouncedSetSearchTerm]
  );

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

  const StatsCard = memo(
    ({ title, value, icon: Icon, trend, color = "blue" }) => (
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
    )
  );

  const EnhancedOperationCard = memo(({ operation }) => {
    const handleStatusChange = useCallback(
      (e) => handleUpdateOperationStatus(operation._id, e.target.value),
      [operation._id]
    );

    const handleVolunteerAssign = useCallback(
      (e) => handleAssignVolunteer(operation._id, e.target.value),
      [operation._id]
    );

    return (
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
            onChange={handleVolunteerAssign}
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
            onChange={handleStatusChange}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            value={operation.status}
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
  });

  const CommunicationPanel = memo(() => {
    const handleOperationChange = useCallback(
      (e) =>
        setNewMessage((prev) => ({ ...prev, operationId: e.target.value })),
      []
    );

    const handleTypeChange = useCallback(
      (e) => setNewMessage((prev) => ({ ...prev, type: e.target.value })),
      []
    );

    const handlePriorityChange = useCallback(
      (e) => setNewMessage((prev) => ({ ...prev, priority: e.target.value })),
      []
    );

    const debouncedSetMessage = useCallback(
      debounce((value) => {
        setNewMessage((prev) => ({ ...prev, message: value }));
      }, 300),
      []
    );

    const handleMessageChange = useCallback(
      (e) => debouncedSetMessage(e.target.value),
      [debouncedSetMessage]
    );

    return (
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Send Message
          </h3>
          <div className="space-y-4">
            <select
              value={newMessage.operationId}
              onChange={handleOperationChange}
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
                onChange={handleTypeChange}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="update">Update</option>
                <option value="alert">Alert</option>
                <option value="instruction">Instruction</option>
                <option value="notification">Notification</option>
              </select>

              <select
                value={newMessage.priority}
                onChange={handlePriorityChange}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <textarea
              value={newMessage.message}
              onChange={handleMessageChange}
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
  });

  const VolunteerManagementPanel = memo(() => (
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
  ));

  const ReportsPanel = memo(() => (
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
          <h4 className="text-md font-semibold text-gray-900 mb-2">
            Recent Reports
          </h4>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {reports.map((report) => (
              <div
                key={report._id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {report.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {report.description || "No description available"}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${getStatusColor(
                      report.status
                    )}`}
                  >
                    {report.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => handleDownloadReport(report._id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ));

  const handleDownloadReport = useCallback(
    async (reportId) => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/api/coordinator/reports/${reportId}/download`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to download report");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setSuccess("Report downloaded successfully");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError(`Error downloading report: ${err.message}`);
      }
    },
    [API_BASE_URL]
  );

  const NotificationPanel = memo(() => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Notifications
      </h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className="flex items-start gap-3 p-3 border-b border-gray-100"
          >
            <Bell className="h-5 w-5 text-blue-500 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-800">{notification.message}</p>
              <p className="text-xs text-gray-500">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            {notification.operationId && (
              <button
                onClick={() =>
                  setSelectedOperation(
                    operations.find((op) => op._id === notification.operationId)
                  )
                }
                className="text-blue-600 hover:text-blue-800"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  ));

  const OperationDetailsModal = memo(() => {
    if (!selectedOperation) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {selectedOperation.title}
            </h3>
            <button
              onClick={() => setSelectedOperation(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Description</p>
              <p className="text-gray-800">{selectedOperation.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Location</p>
              <p className="text-gray-800">
                {selectedOperation.location.name} (
                {selectedOperation.location.address})
              </p>
              <p className="text-gray-600 text-sm">
                Coordinates: {selectedOperation.location.coordinates.latitude},{" "}
                {selectedOperation.location.coordinates.longitude}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <span
                className={`px-3 py-1 text-xs rounded-full ${getStatusColor(
                  selectedOperation.status
                )}`}
              >
                {selectedOperation.status.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Priority</p>
              <span
                className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(
                  selectedOperation.priority
                )} text-white`}
              >
                {selectedOperation.priority.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Requester</p>
              <p className="text-gray-800">
                {selectedOperation.requester.name} (
                {selectedOperation.requester.phone})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Team</p>
              <p className="text-gray-800">
                {selectedOperation.assignedVolunteers?.length || 0} /{" "}
                {selectedOperation.teamSize} assigned
              </p>
            </div>
            {selectedOperation.requiredSkills?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Required Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedOperation.requiredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedOperation.equipment?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600">Equipment</p>
                <div className="flex flex-wrap gap-2">
                  {selectedOperation.equipment.map((item, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600">
                Estimated Duration
              </p>
              <p className="text-gray-800">
                {Math.floor(selectedOperation.estimatedDuration / 60)}h{" "}
                {selectedOperation.estimatedDuration % 60}m
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Level</p>
              <p className="text-gray-800 capitalize">
                {selectedOperation.riskLevel}
              </p>
            </div>
            {selectedOperation.weatherConditions && (
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Weather Conditions
                </p>
                <p className="text-gray-800">
                  {selectedOperation.weatherConditions}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() =>
                handleGenerateReport(
                  selectedOperation._id,
                  "operations-summary"
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </button>
            <button
              onClick={() => setShowCommunication(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4" />
              Send Message
            </button>
          </div>
        </div>
      </div>
    );
  });

  const VolunteerDetailsModal = memo(() => {
    if (!selectedVolunteer) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {selectedVolunteer.name}
            </h3>
            <button
              onClick={() => setSelectedVolunteer(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  selectedVolunteer.isAvailable
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedVolunteer.isAvailable ? "Available" : "Busy"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Contact</p>
              <p className="text-gray-800">
                {selectedVolunteer.phone || "N/A"}
              </p>
              <p className="text-gray-800">{selectedVolunteer.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Location</p>
              <p className="text-gray-800">
                {selectedVolunteer.location &&
                selectedVolunteer.location.coordinates
                  ? `${selectedVolunteer.location.coordinates[1]}, ${selectedVolunteer.location.coordinates[0]}`
                  : "Location not set"}
              </p>
            </div>
            {selectedVolunteer.skills?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedVolunteer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedVolunteer.assignedOperations?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Assigned Operations
                </p>
                <div className="space-y-2">
                  {selectedVolunteer.assignedOperations.map((op) => (
                    <div
                      key={op._id}
                      className="text-sm text-gray-800 border-b border-gray-100 pb-1"
                    >
                      <span>{op.title}</span>
                      <span
                        className={`ml-2 text-xs ${getStatusColor(op.status)}`}
                      >
                        {op.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => {
                setNewMessage({
                  ...newMessage,
                  operationId: "",
                  message: `Message to ${selectedVolunteer.name}: `,
                });
                setShowCommunication(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4" />
              Send Message
            </button>
            <button
              onClick={() =>
                handleGenerateReport(
                  selectedVolunteer._id,
                  "volunteer-performance"
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>
    );
  });

  const CreateOperationModal = memo(() => {
    useEffect(() => {
      if (showCreateOperation && titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, [showCreateOperation]);

    const debouncedSetNewOperation = useCallback(
      debounce((updates) => {
        setNewOperation((prev) => ({ ...prev, ...updates }));
      }, 300),
      []
    );

    const handleTitleChange = useCallback(
      (e) => debouncedSetNewOperation({ title: e.target.value }),
      [debouncedSetNewOperation]
    );

    const handleDescriptionChange = useCallback(
      (e) => debouncedSetNewOperation({ description: e.target.value }),
      [debouncedSetNewOperation]
    );

    const handleLocationNameChange = useCallback(
      (e) =>
        debouncedSetNewOperation({
          location: { ...newOperation.location, name: e.target.value },
        }),
      [debouncedSetNewOperation, newOperation.location]
    );

    const handleAddressChange = useCallback(
      (e) =>
        debouncedSetNewOperation({
          location: { ...newOperation.location, address: e.target.value },
        }),
      [debouncedSetNewOperation, newOperation.location]
    );

    const handleLatitudeChange = useCallback(
      (e) =>
        debouncedSetNewOperation({
          location: {
            ...newOperation.location,
            coordinates: {
              ...newOperation.location.coordinates,
              latitude: parseFloat(e.target.value),
            },
          },
        }),
      [debouncedSetNewOperation, newOperation.location]
    );

    const handleLongitudeChange = useCallback(
      (e) =>
        debouncedSetNewOperation({
          location: {
            ...newOperation.location,
            coordinates: {
              ...newOperation.location.coordinates,
              longitude: parseFloat(e.target.value),
            },
          },
        }),
      [debouncedSetNewOperation, newOperation.location]
    );

    const handleRequesterNameChange = useCallback(
      (e) =>
        debouncedSetNewOperation({
          requester: { ...newOperation.requester, name: e.target.value },
        }),
      [debouncedSetNewOperation, newOperation.requester]
    );

    const handleRequesterPhoneChange = useCallback(
      (e) =>
        debouncedSetNewOperation({
          requester: { ...newOperation.requester, phone: e.target.value },
        }),
      [debouncedSetNewOperation, newOperation.requester]
    );

    const handleTypeChange = useCallback(
      (e) => debouncedSetNewOperation({ type: e.target.value }),
      [debouncedSetNewOperation]
    );

    const handleCategoryChange = useCallback(
      (e) => debouncedSetNewOperation({ category: e.target.value }),
      [debouncedSetNewOperation]
    );

    const handlePriorityChange = useCallback(
      (e) => debouncedSetNewOperation({ priority: e.target.value }),
      [debouncedSetNewOperation]
    );

    const handleDurationChange = useCallback(
      (e) =>
        debouncedSetNewOperation({
          estimatedDuration: parseInt(e.target.value),
        }),
      [debouncedSetNewOperation]
    );

    const handleTeamSizeChange = useCallback(
      (e) => debouncedSetNewOperation({ teamSize: parseInt(e.target.value) }),
      [debouncedSetNewOperation]
    );

    const handleSkillsChange = useCallback(
      (e) =>
        debouncedSetNewOperation({
          requiredSkills: e.target.value
            ? e.target.value.split(",").map((s) => s.trim())
            : [],
        }),
      [debouncedSetNewOperation]
    );

    const handleEquipmentChange = useCallback(
      (e) =>
        debouncedSetNewOperation({
          equipment: e.target.value
            ? e.target.value.split(",").map((s) => s.trim())
            : [],
        }),
      [debouncedSetNewOperation]
    );

    const handleWeatherChange = useCallback(
      (e) => debouncedSetNewOperation({ weatherConditions: e.target.value }),
      [debouncedSetNewOperation]
    );

    const handleRiskLevelChange = useCallback(
      (e) => debouncedSetNewOperation({ riskLevel: e.target.value }),
      [debouncedSetNewOperation]
    );

    if (!showCreateOperation) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Create New Operation
            </h3>
            <button
              onClick={() => setShowCreateOperation(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Title *
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={newOperation.title}
                onChange={handleTitleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter operation title"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Description *
              </label>
              <textarea
                value={newOperation.description}
                onChange={handleDescriptionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="4"
                placeholder="Enter operation description"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Location Name *
              </label>
              <input
                type="text"
                value={newOperation.location.name}
                onChange={handleLocationNameChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter location name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Address *
              </label>
              <input
                type="text"
                value={newOperation.location.address}
                onChange={handleAddressChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Latitude *
                </label>
                <input
                  type="number"
                  value={newOperation.location.coordinates.latitude}
                  onChange={handleLatitudeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Latitude"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Longitude *
                </label>
                <input
                  type="number"
                  value={newOperation.location.coordinates.longitude}
                  onChange={handleLongitudeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Longitude"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Requester Name *
              </label>
              <input
                type="text"
                value={newOperation.requester.name}
                onChange={handleRequesterNameChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter requester name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Requester Phone *
              </label>
              <input
                type="text"
                value={newOperation.requester.phone}
                onChange={handleRequesterPhoneChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter requester phone"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Type *
              </label>
              <select
                value={newOperation.type}
                onChange={handleTypeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select type</option>
                <option value="emergency">Emergency</option>
                <option value="routine">Routine</option>
                <option value="training">Training</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Category *
              </label>
              <select
                value={newOperation.category}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select category</option>
                <option value="rescue">Rescue</option>
                <option value="evacuation">Evacuation</option>
                <option value="medical">Medical</option>
                <option value="supply">Supply</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Priority
              </label>
              <select
                value={newOperation.priority}
                onChange={handlePriorityChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                value={newOperation.estimatedDuration}
                onChange={handleDurationChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter duration in minutes"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Team Size
              </label>
              <input
                type="number"
                value={newOperation.teamSize}
                onChange={handleTeamSizeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter team size"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Required Skills
              </label>
              <input
                type="text"
                value={newOperation.requiredSkills.join(", ")}
                onChange={handleSkillsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter skills (comma-separated)"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Equipment
              </label>
              <input
                type="text"
                value={newOperation.equipment.join(", ")}
                onChange={handleEquipmentChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter equipment (comma-separated)"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Weather Conditions
              </label>
              <input
                type="text"
                value={newOperation.weatherConditions}
                onChange={handleWeatherChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter weather conditions"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Risk Level
              </label>
              <select
                value={newOperation.riskLevel}
                onChange={handleRiskLevelChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={handleCreateOperation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={isLoading}
            >
              <Save className="h-4 w-4" />
              Create Operation
            </button>
            <button
              onClick={() => setShowCreateOperation(false)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Coordinator Dashboard
              </h1>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${getWsStatusColor(
                    wsStatus
                  )}`}
                ></div>
                <span className="text-sm text-gray-600">
                  WebSocket: {getWsStatusText(wsStatus)}
                </span>
                {wsStatus !== "connected" && (
                  <button
                    onClick={handleManualReconnect}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                  realTimeUpdates
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                <Radio className="h-4 w-4" />
                {realTimeUpdates ? "Real-time On" : "Real-time Off"}
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="text-gray-600 hover:text-gray-800"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-6">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            icon={Zap}
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

        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            {["operations", "volunteers", "communications", "reports"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === tab
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              )
            )}
          </div>
        </div>

        {activeTab === "operations" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Operations
              </h2>
              <button
                onClick={() => setShowCreateOperation(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Operation
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search operations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredOperations.map((operation) => (
                  <EnhancedOperationCard
                    key={operation._id}
                    operation={operation}
                  />
                ))}
              </div>
            </div>

            <NotificationPanel />
          </div>
        )}

        {activeTab === "volunteers" && <VolunteerManagementPanel />}
        {activeTab === "communications" && <CommunicationPanel />}
        {activeTab === "reports" && <ReportsPanel />}

        <OperationDetailsModal />
        <VolunteerDetailsModal />
        <CreateOperationModal />
      </main>
    </div>
  );
};

export default CoordinatorDashboard;
