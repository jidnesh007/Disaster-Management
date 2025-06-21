import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import Volunteer from "./pages/Volunteer.jsx";
import Admin from "./pages/Admin.jsx";
import HomePage from "./pages/HomePage.jsx";
import CoordinatorDashboard from "./CoordinatorDashboard.jsx";
import SOSSystem from "./pages/SOSSystem.jsx";
import MumbaiDisasterMap from "./pages/MumbaiDisasterMap.jsx";
import IncidentReportForm from "./pages/IncidentReportForm.jsx";
import LiveAlerts from "./pages/LiveAlerts.jsx";
import Resource from "./pages/Resource.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

// ErrorBoundary to catch and handle runtime errors gracefully
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center min-h-screen bg-gray-50">
          <h2 className="text-2xl text-red-600 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>

          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/coordinator" element={<CoordinatorDashboard />} />
          <Route path="/sos" element={<SOSSystem />} />
          <Route path="/map" element={<MumbaiDisasterMap />} />
          <Route path="/incident-report" element={<IncidentReportForm />} />
          <Route path="/resource" element={<Resource />} />
          <Route path="/live" element={<LiveAlerts />} />
          <Route path="/dashboard" element={<div>Dashboard Placeholder</div>} />
          <Route
            path="*"
            element={
              <div className="p-4 text-center">
                <h2 className="text-2xl text-gray-900">404 - Page Not Found</h2>
              </div>
            }
          />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
