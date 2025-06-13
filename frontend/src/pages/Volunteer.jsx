import React, { useState, useEffect } from "react";
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
} from "lucide-react";

const Volunteer = () => {
  const navigate = useNavigate();

  // State management
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {}
  );
  const [isAvailable, setIsAvailable] = useState(user.isAvailable || false);
  const [operations, setOperations] = useState([]);
  const [stats, setStats] = useState({
    totalOperations: 0,
    completedOperations: 0,
    activeOperations: 0,
    hoursVolunteered: 0,
    completionRate: 0,
    averageResponseTime: 0,
    highPriorityOperations: 0,
    rating: 0,
    badgesEarned: 0,
    livesImpacted: 0,
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch user data
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const userData = {
          ...data.data.user,
          rating: data.data.user.rating || 4.8,
          level: data.data.user.level || "Expert",
          badges: data.data.user.badges || ["Quick Responder", "Life Saver"],
          totalHours: data.data.user.totalHours || 156,
          profilePicture: data.data.user.profilePicture || null,
        };
        setUser(userData);
        setIsAvailable(userData.isAvailable);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Fetch user error:", error);
      setMessage("Network error fetching user data");
      handleLogout();
    }
  };

  // Fetch operations
  const fetchOperations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/rescue/my-operations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setOperations(data.data);
      } else {
        setMessage(data.message || "Failed to fetch operations");
        if (["Invalid token", "Token expired"].includes(data.message)) {
          handleLogout();
        }
      }
    } catch (error) {
      console.error("Fetch operations error:", error);
      setMessage("Network error fetching operations");
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/rescue/my-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setMessage(data.message || "Failed to fetch stats");
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
      setMessage("Network error fetching stats");
    }
  };

  // Update availability
  const updateAvailability = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/rescue/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      });
      const data = await response.json();
      if (data.success) {
        setIsAvailable(data.data.isAvailable);
        const updatedUser = { ...user, isAvailable: data.data.isAvailable };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setMessage(data.message);
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(data.message || "Failed to update availability");
        if (["Invalid token", "Token expired"].includes(data.message)) {
          handleLogout();
        }
      }
    } catch (error) {
      console.error("Update availability error:", error);
      setMessage("Network error updating availability");
    } finally {
      setIsLoading(false);
    }
  };

  // Update operation status
  const updateOperationStatus = async (operationId, newStatus) => {
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/rescue/operations/${operationId}/status`,
        {
          method: "PATCH",
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
            op._id === operationId ? { ...op, volunteerStatus: newStatus } : op
          )
        );
        setMessage("Operation status updated successfully");
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(data.message || "Failed to update operation status");
      }
    } catch (error) {
      console.error("Update operation status error:", error);
      setMessage("Network error updating operation status");
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!user.name?.trim() || !user.email?.trim() || !user.phone?.trim()) {
      setMessage("Please fill in all required fields");
      return;
    }
    setIsLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone,
          skills: user.skills,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data.user);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setIsEditingProfile(false);
        setMessage("Profile updated successfully");
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Save profile error:", error);
      setMessage("Network error updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Add skill
  const handleAddSkill = () => {
    if (!newSkill.trim()) {
      setMessage("Please enter a valid skill");
      return;
    }
    const formattedSkill = newSkill.toLowerCase().replace(" ", "_");
    if (user.skills?.includes(formattedSkill)) {
      setMessage("Skill already exists");
      return;
    }
    setUser((prev) => ({
      ...prev,
      skills: [...prev.skills, formattedSkill],
    }));
    setNewSkill("");
    setMessage("Skill added successfully");
  };

  // Logout
  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    setMessage("Logging out...");
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Mock notifications (replace with API if implemented)
  const fetchNotifications = () => {
    setNotifications([
      {
        id: "1",
        message: "New high-priority operation assigned",
        time: "5 min ago",
        read: false,
      },
      {
        id: "2",
        message: "Team commended your quick response",
        time: "1 hour ago",
        read: false,
      },
      {
        id: "3",
        message: "Training session reminder for tomorrow",
        time: "2 hours ago",
        read: true,
      },
    ]);
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
    } else {
      fetchUser();
      fetchOperations();
      fetchStats();
      fetchNotifications();
    }
  }, [navigate]);

  const filteredOperations = operations.filter((op) => {
    const matchesStatus = filterStatus === "all" || op.status === filterStatus;
    const matchesSearch =
      op.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.location.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
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
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Components
  const EnhancedStatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "blue",
    trend,
    onClick,
  }) => (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick && onClick()}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-bold text-${color}-600 mt-1`}>
              {value}
            </p>
            {trend !== undefined && (
              <div
                className={`flex items-center text-xs font-medium ${
                  trend > 0
                    ? "text-green-600"
                    : trend < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : null}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-xl`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const EnhancedOperationCard = ({ operation }) => {
    const timeAgo = new Date(operation.createdAt);
    const hoursAgo = Math.floor((Date.now() - timeAgo) / (1000 * 60 * 60));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
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
          <button
            onClick={() => setSelectedOperation(operation)}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            aria-label="View operation details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
            <span className="font-medium">{operation.location.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-orange-500" />
              <span>{hoursAgo}h ago</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Timer className="h-4 w-4 mr-2 text-purple-500" />
              <span>
                {Math.floor(operation.estimatedDuration / 60)}h{" "}
                {operation.estimatedDuration % 60}m
              </span>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 text-green-500" />
            <span>
              Team of {operation.teamSize} • Role: {operation.volunteerRole}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="h-4 w-4 mr-2 text-indigo-500">🌤️</span>
            <span>{operation.weatherConditions}</span>
          </div>
          {operation.updates > 0 && (
            <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <Bell className="h-4 w-4 mr-2" />
              <span>{operation.updates} new updates</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {operation.equipment.map((item, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              updateOperationStatus(
                operation._id,
                operation.volunteerStatus === "assigned"
                  ? "acknowledged"
                  : "en-route"
              )
            }
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Update Status
          </button>
          <button
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400"
            aria-label="Navigate"
          >
            <Navigation className="h-4 w-4" />
          </button>
          <button
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400"
            aria-label="Message"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const AchievementBadge = ({ badge, earned = false }) => (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
        earned
          ? "bg-yellow-50 border-yellow-200 text-yellow-800"
          : "bg-gray-50 border-gray-200 text-gray-500"
      }`}
    >
      <Award
        className={`h-4 w-4 ${earned ? "text-yellow-600" : "text-gray-400"}`}
      />
      <span className="text-sm font-medium">{badge}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {user.name ? user.name.charAt(0) : "U"}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    isAvailable ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                ></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Welcome back, {user.name || "Volunteer"}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-yellow-600 font-medium">
                      {user.rating || 0}
                    </span>
                  </div>
                </h1>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-600">
                    {user.role || "Volunteer"} • {user.level || "N/A"}
                  </p>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {user.totalHours || 0}h volunteered
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  {isAvailable ? "Available" : "Unavailable"}
                </span>
                <button
                  onClick={updateAvailability}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                    isAvailable
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl"
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl"
                  } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105`}
                  aria-label={isAvailable ? "Go offline" : "Go online"}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    <>
                      {isAvailable ? (
                        <>
                          <XCircle className="h-4 w-4 inline mr-2" />
                          Go Offline
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 inline mr-2" />
                          Go Online
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors relative"
                  aria-label="View notifications"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                            !notif.read ? "bg-blue-50" : ""
                          }`}
                          onClick={() => markNotificationRead(notif.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === "Enter" && markNotificationRead(notif.id)
                          }
                        >
                          <p className="text-sm text-gray-900">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm mb-6 border border-gray-100">
          {[
            { id: "dashboard", label: "Dashboard", icon: Activity },
            { id: "operations", label: "Operations", icon: AlertTriangle },
            { id: "achievements", label: "Achievements", icon: Award },
            { id: "profile", label: "Profile", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
              }`}
              aria-label={`Switch to ${tab.label} tab`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <EnhancedStatCard
                icon={Award}
                title="Operations Completed"
                value={stats.completedOperations}
                subtitle={`${stats.completionRate}% success rate`}
                color="green"
                trend={12}
              />
              <EnhancedStatCard
                icon={Activity}
                title="Active Operations"
                value={stats.activeOperations}
                subtitle="Currently assigned"
                color="blue"
                trend={0}
              />
              <EnhancedStatCard
                icon={Heart}
                title="Lives Impacted"
                value={stats.livesImpacted}
                subtitle="People helped"
                color="red"
                trend={8}
              />
              <EnhancedStatCard
                icon={Zap}
                title="Response Time"
                value={`${stats.averageResponseTime}min`}
                subtitle="Average response"
                color="orange"
                trend={-5}
              />
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                  <Search className="h-5 w-5" />
                  <span className="font-medium">Find Operations</span>
                </button>
                <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Schedule Training</span>
                </button>
                <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                  <Share2 className="h-5 w-5" />
                  <span className="font-medium">Share Progress</span>
                </button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Performance Overview
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Operation Success Rate</span>
                      <span>{stats.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stats.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Response Time (Target: 15min)</span>
                      <span>{stats.averageResponseTime}min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            ((15 - stats.averageResponseTime) / 15) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {user.rating || 0}
                    </div>
                    <div className="flex justify-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.floor(user.rating || 0)
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">Overall Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operations Tab */}
        {activeTab === "operations" && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search operations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="Search operations"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Filter by status"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <span className="text-sm text-gray-600">
                    {filteredOperations.length} operations
                  </span>
                </div>
              </div>
            </div>

            {filteredOperations.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Operations Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "You don't have any active rescue operations at the moment."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {user.badges?.length || 0}
                </h3>
                <p className="text-gray-600">Badges Earned</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {stats.completedOperations}
                </h3>
                <p className="text-gray-600">Missions Completed</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {stats.livesImpacted}
                </h3>
                <p className="text-gray-600">Lives Impacted</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Your Achievements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user.badges || []).map((badge, index) => (
                  <AchievementBadge key={index} badge={badge} earned={true} />
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Next Achievements
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Century Club</h3>
                    <p className="text-sm text-gray-600">
                      Complete 100 rescue operations
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "20%" }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      20/100 operations
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Timer className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Speed Demon</h3>
                    <p className="text-sm text-gray-600">
                      Maintain sub-10 minute response time
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      8/10 fast responses needed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Profile Information
                </h2>
                <button
                  onClick={() =>
                    isEditingProfile
                      ? handleSaveProfile()
                      : setIsEditingProfile(true)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  aria-label={
                    isEditingProfile ? "Save profile changes" : "Edit profile"
                  }
                >
                  {isEditingProfile ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Edit className="h-4 w-4" />
                  )}
                  {isEditingProfile ? "Save Changes" : "Edit Profile"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                      {user.name ? user.name.charAt(0) : "U"}
                    </div>
                    {isEditingProfile && (
                      <button
                        className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                        aria-label="Change profile picture"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.floor(user.rating || 0)
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        ({user.rating || 0})
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {user.level || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-2"
                        htmlFor="name"
                      >
                        Name
                      </label>
                      {isEditingProfile ? (
                        <input
                          id="name"
                          type="text"
                          value={user.name || ""}
                          onChange={(e) =>
                            setUser((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-required="true"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">
                          {user.name || "N/A"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <p className="text-gray-900 py-2">{user.role || "N/A"}</p>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-2"
                        htmlFor="email"
                      >
                        Email
                      </label>
                      {isEditingProfile ? (
                        <input
                          id="email"
                          type="email"
                          value={user.email || ""}
                          onChange={(e) =>
                            setUser((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-required="true"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">
                          {user.email || "N/A"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-2"
                        htmlFor="phone"
                      >
                        Phone
                      </label>
                      {isEditingProfile ? (
                        <input
                          id="phone"
                          type="tel"
                          value={user.phone || ""}
                          onChange={(e) =>
                            setUser((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-required="true"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">
                          {user.phone || "N/A"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Skills & Certifications
              </h3>
              <div className="flex flex-wrap gap-3">
                {(user.skills || []).map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full border border-blue-200"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">
                      {skill.replace("_", " ").toUpperCase()}
                    </span>
                    {isEditingProfile && (
                      <button
                        onClick={() =>
                          setUser((prev) => ({
                            ...prev,
                            skills: prev.skills.filter((_, i) => i !== index),
                          }))
                        }
                        className="ml-2 text-red-500 hover:text-red-700"
                        aria-label={`Remove ${skill} skill`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditingProfile && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add new skill"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="Add new skill"
                    />
                    <button
                      onClick={handleAddSkill}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="Add skill"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/80 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {user.totalHours || 0}
                </h3>
                <p className="text-gray-600">Hours Volunteered</p>
              </div>
              <div className="backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <Heart className="h-8 w-8 text-red-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.livesImpacted}
                </h3>
                <p className="text-gray-600">Lives Impacted</p>
              </div>
              <div className="backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <Activity className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </h3>
                <p className="text-gray-600">Member Since</p>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className="fixed top-20 right-6 z-50">
            <div
              className={`px-6 py-4 rounded-lg shadow-lg border-l-4 ${
                message.includes("success") || message.includes("updated")
                  ? "bg-green-50 border-green-500 text-green-800"
                  : message.includes("error") || message.includes("failed")
                  ? "bg-red-50 border-red-500 text-red-800"
                  : "bg-blue-50 border-blue-500 text-blue-800"
              } max-w-md`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{message}</p>
                <button
                  onClick={() => setMessage("")}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                  aria-label="Dismiss message"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Operation Detail Modal */}
        {selectedOperation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedOperation.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getPriorityColor(
                          selectedOperation.priority
                        )}`}
                      ></div>
                      <span className="text-sm font-medium text-gray-600">
                        {selectedOperation.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOperation(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-600">
                      {selectedOperation.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Location
                      </h3>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{selectedOperation.location.name}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Duration
                      </h3>
                      <div className="flex items-center text-gray-600">
                        <Timer className="h-4 w-4 mr-2" />
                        <span>
                          {Math.floor(selectedOperation.estimatedDuration / 60)}
                          h {selectedOperation.estimatedDuration % 60}m
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Team Size
                      </h3>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{selectedOperation.teamSize} volunteers</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Weather
                      </h3>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">🌤️</span>
                        <span>{selectedOperation.weatherConditions}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Required Equipment
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedOperation.equipment.map((item, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Your Role
                    </h3>
                    <p className="text-gray-600">
                      {selectedOperation.volunteerRole}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        updateOperationStatus(
                          selectedOperation._id,
                          selectedOperation.volunteerStatus === "assigned"
                            ? "acknowledged"
                            : "en-route"
                        );
                        setSelectedOperation(null);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Update Status
                    </button>
                    <button
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      aria-label="Navigate to location"
                    >
                      <Navigation className="h-4 w-4" />
                    </button>
                    <button
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      aria-label="Contact team"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Volunteer;
