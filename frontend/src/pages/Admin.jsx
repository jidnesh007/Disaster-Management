import React, { useState, useCallback, useEffect } from "react";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  User,
  Mail,
  Lock,
} from "lucide-react";
import _ from "lodash";

const Admin = () => {
  const [currentView, setCurrentView] = useState("login"); // 'login' or 'admin'
  const [user, setUser] = useState(null);

  // Login state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  // Admin state
  const [volunteers, setVolunteers] = useState([]);
  const [operationFormData, setOperationFormData] = useState({
    title: "",
    locationName: "",
    latitude: "",
    longitude: "",
    assignedVolunteerIds: [],
  });
  const [operationMessage, setOperationMessage] = useState("");
  const [operationLoading, setOperationLoading] = useState(false);

  // Hardcoded admin credentials
  const ADMIN_CREDENTIALS = {
    email: "admin",
    password: "123456",
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === "admin";
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) newErrors.email = "Email/Username is required";
    else if (!validateEmail(formData.email))
      newErrors.email = "Invalid email or use 'admin' as username";
    if (!formData.password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = useCallback(
    _.debounce(async () => {
      if (!validateForm()) return;

      setIsLoading(true);
      setMessage("");

      // Simulate API delay
      setTimeout(() => {
        if (
          formData.email === ADMIN_CREDENTIALS.email &&
          formData.password === ADMIN_CREDENTIALS.password
        ) {
          setUser({ name: "Admin", role: "admin", email: "admin" });
          setMessage("Login successful! Redirecting...");
          setTimeout(() => {
            setCurrentView("admin");
            setMessage("");
          }, 1500);
        } else {
          setMessage(
            "Invalid credentials. Use username: 'admin' and password: '123456'"
          );
        }
        setIsLoading(false);
      }, 1000);
    }, 500),
    [formData]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const fetchVolunteers = async () => {
    try {
      // Simulate API call - in real app this would fetch from backend
      setOperationMessage("No volunteers available - connect to backend API");
    } catch (error) {
      console.error("Fetch volunteers error:", error);
      setOperationMessage("Network error");
    }
  };

  const handleCreateOperation = async (e) => {
    e.preventDefault();
    setOperationLoading(true);
    setOperationMessage("");

    try {
      // Simulate API call - in real app this would post to backend
      setTimeout(() => {
        setOperationMessage(
          "Operation would be created (connect to backend API)"
        );
        setOperationFormData({
          title: "",
          locationName: "",
          latitude: "",
          longitude: "",
          assignedVolunteerIds: [],
        });
        setOperationLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Create operation error:", error);
      setOperationMessage("Network error");
      setOperationLoading(false);
    }
  };

  const handleVolunteerToggle = (volunteerId) => {
    setOperationFormData((prev) => ({
      ...prev,
      assignedVolunteerIds: prev.assignedVolunteerIds.includes(volunteerId)
        ? prev.assignedVolunteerIds.filter((id) => id !== volunteerId)
        : [...prev.assignedVolunteerIds, volunteerId],
    }));
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("login");
    setFormData({ email: "", password: "" });
    setMessage("");
  };

  useEffect(() => {
    if (currentView === "admin" && user?.role === "admin") {
      fetchVolunteers();
    }
  }, [currentView, user]);

  if (currentView === "admin" && user?.role === "admin") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white p-6 rounded-md shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mb-6">Welcome, {user.name || "Admin"}!</p>

          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Create Rescue Operation
          </h2>
          <form onSubmit={handleCreateOperation} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-600"
              >
                Operation Title
              </label>
              <input
                id="title"
                type="text"
                value={operationFormData.title}
                onChange={(e) =>
                  setOperationFormData({
                    ...operationFormData,
                    title: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter operation title"
                required
              />
            </div>
            <div>
              <label
                htmlFor="locationName"
                className="block text-sm font-medium text-gray-600"
              >
                Location Name
              </label>
              <input
                id="locationName"
                type="text"
                value={operationFormData.locationName}
                onChange={(e) =>
                  setOperationFormData({
                    ...operationFormData,
                    locationName: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter location name"
                required
              />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label
                  htmlFor="latitude"
                  className="block text-sm font-medium text-gray-600"
                >
                  Latitude
                </label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  value={operationFormData.latitude}
                  onChange={(e) =>
                    setOperationFormData({
                      ...operationFormData,
                      latitude: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Enter latitude"
                  required
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="longitude"
                  className="block text-sm font-medium text-gray-600"
                >
                  Longitude
                </label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  value={operationFormData.longitude}
                  onChange={(e) =>
                    setOperationFormData({
                      ...operationFormData,
                      longitude: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Enter longitude"
                  required
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Assign Volunteers
              </h3>
              {volunteers.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No available volunteers.
                </p>
              ) : (
                <div className="space-y-2">
                  {volunteers.map((volunteer) => (
                    <label
                      key={volunteer._id}
                      className="block flex items-center"
                    >
                      <input
                        type="checkbox"
                        checked={operationFormData.assignedVolunteerIds.includes(
                          volunteer._id
                        )}
                        onChange={() => handleVolunteerToggle(volunteer._id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        {volunteer.name} ({volunteer.email})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={operationLoading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {operationLoading ? "Creating..." : "Create Operation"}
            </button>
          </form>

          {operationMessage && (
            <p
              className={`mt-4 text-sm ${
                operationMessage.includes("created")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {operationMessage}
            </p>
          )}

          <button
            onClick={handleLogout}
            className="mt-6 w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-medium text-gray-900">
            Disaster Management System
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Login to your admin account
          </p>
          <p className="mt-2 text-xs text-blue-600">
            Demo: Username: "admin", Password: "123456"
          </p>
        </div>

        <div className="bg-white py-8 px-4 rounded-md shadow-sm">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="text-sm block font-medium text-gray-600"
              >
                Username/Email
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 px-3 py-2 border ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter username or email"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm block font-medium text-gray-600"
              >
                Password
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 px-3 py-2 border ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter your password"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" /> {errors.password}
                </p>
              )}
            </div>

            {message && (
              <div
                className={`p-3 rounded-md ${
                  message.includes("successful")
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
                className="group relative w-full flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>Secure disaster management and emergency response platform</p>
        </div>
      </div>
    </div>
  );
};
export default Admin;