import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "citizen",
    phone: "",
  });

  // Use Vite's environment variable access
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (isRegistering) {
      if (!registerData.name.trim()) newErrors.name = "Name is required";
      if (!registerData.email.trim()) newErrors.email = "Email is required";
      else if (!validateEmail(registerData.email))
        newErrors.email = "Invalid email";
      if (!registerData.password) newErrors.password = "Password is required";
      else if (registerData.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
      if (registerData.password !== registerData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    } else {
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!validateEmail(formData.email))
        newErrors.email = "Invalid email";
      if (!formData.password) newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = useCallback(
    _.debounce(async () => {
      if (!validateForm()) return;

      setIsLoading(true);
      setMessage("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        }

        const data = await response.json();

        if (data.success) {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data.user));
          setMessage("Login successful! Redirecting...");
          setTimeout(() => {
            const user = data.data.user;
            switch (user.role) {
              case "volunteer":
                navigate("/volunteer");
                break;
              case "admin":
                navigate("/admin");
                break;
              case "coordinator":
                navigate("/coordinator");
                break;
              default:
                navigate("/dashboard");
            }
          }, 1500);
        } else {
          setMessage(data.message || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        setMessage(
          error.message.includes("fetch")
            ? "Cannot connect to server. Please ensure the backend is running."
            : error.message || "Network error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [formData, navigate]
  );

  const handleRegister = useCallback(
    _.debounce(async () => {
      if (!validateForm()) return;

      setIsLoading(true);
      setMessage("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: registerData.name,
            email: registerData.email,
            password: registerData.password,
            role: registerData.role,
            phone: registerData.phone,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Registration failed");
        }

        const data = await response.json();

        if (data.success) {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data.user));
          setMessage("Registration successful! Redirecting...");
          setTimeout(() => {
            const user = data.data.user;
            switch (user.role) {
              case "volunteer":
                navigate("/volunteer");
                break;
              case "admin":
                navigate("/admin");
                break;
              case "coordinator":
                navigate("/coordinator");
                break;
              default:
                navigate("/dashboard");
            }
          }, 1500);
        } else {
          setMessage(data.message || "Registration failed");
        }
      } catch (error) {
        console.error("Registration error:", error);
        setMessage(
          error.message.includes("fetch")
            ? "Cannot connect to server. Please ensure the backend is running."
            : error.message || "Network error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [registerData, navigate]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (isRegistering) {
      setRegisterData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const toggleForm = () => {
    setIsRegistering(!isRegistering);
    setErrors({});
    setMessage("");
    setFormData({ email: "", password: "" });
    setRegisterData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "citizen",
      phone: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-medium text-gray-900">
            Disaster Management System
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isRegistering
              ? "Create your account to get started"
              : "Login to your account"}
          </p>
        </div>

        <div className="bg-white py-8 px-4 rounded-md shadow-sm">
          <div className="space-y-6">
            {isRegistering && (
              <div>
                <label
                  htmlFor="name"
                  className="text-sm block font-medium text-gray-600"
                >
                  Full Name
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={registerData.name}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 px-3 py-2 border ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> {errors.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="text-sm block font-medium text-gray-600"
              >
                Email Address
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={isRegistering ? registerData.email : formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 px-3 py-2 border ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" /> {errors.email}
                </p>
              )}
            </div>

            {isRegistering && (
              <>
                <div>
                  <label
                    htmlFor="phone"
                    className="text-sm block font-medium text-gray-600"
                  >
                    Phone Number (Optional)
                  </label>
                  <div className="mt-2">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={registerData.phone}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="text-sm block font-medium text-gray-600"
                  >
                    Role
                  </label>
                  <div className="mt-2">
                    <select
                      id="role"
                      name="role"
                      value={registerData.role}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="volunteer">Volunteer</option>
                      <option value="coordinator">Coordinator</option>
                    </select>
                  </div>
                </div>
              </>
            )}

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
                  value={
                    isRegistering ? registerData.password : formData.password
                  }
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

            {isRegistering && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-sm block font-medium text-gray-600"
                >
                  Confirm Password
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 px-3 py-2 border ${
                      errors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />{" "}
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

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
                onClick={isRegistering ? handleRegister : handleLogin}
                disabled={isLoading}
                className="group relative w-full flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    {isRegistering ? "Creating Account..." : "Signing in..."}
                  </div>
                ) : isRegistering ? (
                  "Create Account"
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-center">
              <button
                type="button"
                onClick={toggleForm}
                className="text-sm text-red-600 hover:text-red-500"
              >
                {isRegistering
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
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

export default LoginPage;
