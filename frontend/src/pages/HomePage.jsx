import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Shield,
  Users,
  MapPin,
  Phone,
  Activity,
  Clock,
  Bell,
  Menu,
  X,
  ChevronRight,
  Zap,
  Heart,
  Award,
  Globe,
  ArrowRight,
  Cloud,
  Thermometer,
  Wind,
  Eye,
  Star,
  CheckCircle,
  Satellite,
  TrendingUp,
  BarChart3,
  Radio,
  Wifi,
  Database,
  MessageSquare,
  Navigation,
  Target,
  Layers,
  AlertCircle,
  PlayCircle,
  Download,
} from "lucide-react";

const HomePage = () => {
  const [currentAlert, setCurrentAlert] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [statsCounter, setStatsCounter] = useState({
    activeIncidents: 0,
    peopleHelped: 0,
    responseTime: 0,
    sheltersOpen: 0,
    volunteersActive: 0,
    resourcesDeployed: 0,
  });

  const [weatherData, setWeatherData] = useState({
    temp: 28,
    condition: "Partly Cloudy",
    humidity: 65,
    windSpeed: 12,
    visibility: "10km",
    pressure: "1013 hPa",
  });

  const finalStats = {
    activeIncidents: 12,
    peopleHelped: 2543,
    responseTime: 4.2,
    sheltersOpen: 18,
    volunteersActive: 156,
    resourcesDeployed: 89,
  };

  const alerts = [
    {
      type: "critical",
      message: "Severe cyclone warning - Landfall expected in 6 hours",
      location: "Odisha Coast",
      time: "2 min ago",
      severity: "HIGH",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      type: "warning",
      message: "Flash flood alert - Heavy rainfall continues",
      location: "Mumbai, Maharashtra",
      time: "15 min ago",
      severity: "MEDIUM",
      icon: <Cloud className="w-5 h-5" />,
    },
    {
      type: "info",
      message: "Earthquake monitoring - Minor tremors detected",
      location: "Delhi NCR",
      time: "1 hour ago",
      severity: "LOW",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      type: "success",
      message: "Rescue operations completed - 47 people evacuated safely",
      location: "Kerala Backwaters",
      time: "2 hours ago",
      severity: "SUCCESS",
      icon: <CheckCircle className="w-5 h-5" />,
    },
  ];

  const testimonials = [
    {
      name: "Dr. Priya Sharma",
      role: "Emergency Response Coordinator, NDRF",
      message:
        "DisasterShield's AI-powered alerts helped us evacuate 500+ families 2 hours before the cyclone hit. The precision and speed of information saved countless lives.",
      rating: 5,
      image: "👩‍⚕️",
    },
    {
      name: "Rajesh Kumar",
      role: "District Collector, Uttarakhand",
      message:
        "The real-time resource mapping feature revolutionized our disaster response. We could deploy resources 60% faster than traditional methods.",
      rating: 5,
      image: "👨‍💼",
    },
    {
      name: "Meera Patel",
      role: "Volunteer Team Leader, Red Cross",
      message:
        "The volunteer coordination system matched me with the right skills for flood relief. I've never felt more effective in helping my community.",
      rating: 5,
      image: "👩‍🚒",
    },
  ];

  const features = [
    {
      icon: <Satellite className="w-12 h-12" />,
      title: "Satellite Integration",
      description: "Real-time satellite imagery and weather data",
      stat: "24/7 Monitoring",
    },
    {
      icon: <Radio className="w-12 h-12" />,
      title: "Multi-Channel Alerts",
      description: "SMS, Push, Voice, and Emergency Broadcast",
      stat: "4 Alert Channels",
    },
    {
      icon: <Database className="w-12 h-12" />,
      title: "Predictive Analytics",
      description: "AI-powered disaster prediction and modeling",
      stat: "85% Accuracy",
    },
    {
      icon: <Target className="w-12 h-12" />,
      title: "Precision Targeting",
      description: "Location-based emergency response coordination",
      stat: "GPS Accurate",
    },
  ];

  const services = [
    {
      icon: <AlertTriangle className="w-12 h-12" />,
      title: "AI-Powered Emergency Alerts",
      description:
        "Machine learning algorithms analyze multiple data sources to provide hyper-accurate disaster predictions with location-specific impact assessments.",
      features: [
        "Real-time monitoring",
        "Multi-source data fusion",
        "Predictive modeling",
        "Automated escalation",
      ],
      color: "from-red-500 via-red-600 to-red-700",
      stats: { accuracy: "94%", response: "< 30s", coverage: "Pan-India" },
    },
    {
      icon: <MapPin className="w-12 h-12" />,
      title: "Smart Resource Ecosystem",
      description:
        "Dynamic resource allocation with live inventory tracking, optimal route planning, and capacity management for maximum disaster response efficiency.",
      features: [
        "Live GPS tracking",
        "Intelligent routing",
        "Capacity optimization",
        "Resource forecasting",
      ],
      color: "from-blue-500 via-blue-600 to-blue-700",
      stats: { efficiency: "+67%", coverage: "28 States", resources: "10K+" },
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Elite Volunteer Network",
      description:
        "Advanced skill-matching algorithm connects trained volunteers with specific disaster scenarios, ensuring maximum impact and safety.",
      features: [
        "Skill certification",
        "Background verification",
        "Training modules",
        "Performance analytics",
      ],
      color: "from-green-500 via-green-600 to-green-700",
      stats: { volunteers: "50K+", trained: "98%", deployed: "24/7" },
    },
    {
      icon: <Activity className="w-12 h-12" />,
      title: "Unified Command Center",
      description:
        "Centralized incident management with real-time collaboration tools, resource allocation dashboards, and cross-agency coordination.",
      features: [
        "Multi-agency sync",
        "Real-time dashboards",
        "Communication hub",
        "Decision support",
      ],
      color: "from-purple-500 via-purple-600 to-purple-700",
      stats: { agencies: "500+", uptime: "99.9%", response: "Real-time" },
    },
  ];

  const quickActions = [
    {
      label: "Emergency SOS",
      color: "from-red-600 via-red-700 to-red-800",
      icon: <Phone className="w-6 h-6" />,
      urgent: true,
      description: "Immediate emergency assistance",
      link: "/sos",
    },
    {
      label: "Find Safe Zones",
      color: "from-blue-600 via-blue-700 to-blue-800",
      icon: <MapPin className="w-6 h-6" />,
      description: "Locate nearest shelters & hospitals",
      link: "/map",
    },
    {
      label: "Join Response Team",
      color: "from-green-600 via-green-700 to-green-800",
      icon: <Users className="w-6 h-6" />,
      description: "Volunteer for disaster relief",
      link: "/login",
    },
    {
      label: "Report Incident",
      color: "from-orange-600 via-orange-700 to-orange-800",
      icon: <AlertTriangle className="w-6 h-6" />,
      description: "Submit real-time incident reports",
      link: "/incident-report",
    },
  ];

  // Animated counter effect
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;

      setStatsCounter({
        activeIncidents: Math.floor(finalStats.activeIncidents * progress),
        peopleHelped: Math.floor(finalStats.peopleHelped * progress),
        responseTime: parseFloat(
          (finalStats.responseTime * progress).toFixed(1)
        ),
        sheltersOpen: Math.floor(finalStats.sheltersOpen * progress),
        volunteersActive: Math.floor(finalStats.volunteersActive * progress),
        resourcesDeployed: Math.floor(finalStats.resourcesDeployed * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setStatsCounter(finalStats);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, []);

  // Alert rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAlert((prev) => (prev + 1) % alerts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "HIGH":
        return "bg-red-500 animate-pulse";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-blue-500";
      case "SUCCESS":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const currentAlertData = alerts[currentAlert];
  const currentTestimonialData = testimonials[currentTestimonial];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 -left-4 w-96 h-96 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="bg-black/20 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Shield className="w-12 h-12 text-red-500 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <span className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  DisasterShield
                </span>
                <p className="text-xs text-white/70 font-medium">
                  Advanced Emergency Management System
                </p>
              </div>
            </div>

            <div className="hidden md:flex space-x-8 items-center">
              <a
                href="#services"
                className="text-white/80 hover:text-white transition-all duration-300 hover:scale-105 font-medium"
              >
                Services
              </a>
              <a
                href="/live"
                className="text-white/80 hover:text-white transition-all duration-300 hover:scale-105 font-medium"
              >
                Live Alerts
              </a>
              <a
                href="/resource"
                className="text-white/80 hover:text-white transition-all duration-300 hover:scale-105 font-medium"
              >
                Resources
              </a>
              <a
                href="#about"
                className="text-white/80 hover:text-white transition-all duration-300 hover:scale-105 font-medium"
              >
                About
              </a>
              <Link to="/login">
                <button className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white px-8 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-red-500/25 ring-2 ring-red-500/20 hover:ring-red-400/40">
                  <span className="flex items-center space-x-2">
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </Link>
            </div>

            <button
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/40 backdrop-blur-2xl border-t border-white/20">
            <div className="px-4 py-6 space-y-4">
              <a
                href="#services"
                className="block text-white/80 hover:text-white transition-colors py-2"
              >
                Services
              </a>
              <a
                href="#alerts"
                className="block text-white/80 hover:text-white transition-colors py-2"
              >
                Live Alerts
              </a>
              <a
                href="#resources"
                className="block text-white/80 hover:text-white transition-colors py-2"
              >
                Resources
              </a>
              <a
                href="#about"
                className="block text-white/80 hover:text-white transition-colors py-2"
              >
                About
              </a>
              <Link to="/login">
                <button className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-full font-bold mt-4">
                  Login
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Dynamic Alert Banner */}
      <div
        className={`bg-gradient-to-r ${
          currentAlertData.severity === "HIGH"
            ? "from-red-600 via-red-500 to-orange-500"
            : currentAlertData.severity === "MEDIUM"
            ? "from-yellow-600 via-yellow-500 to-orange-500"
            : currentAlertData.severity === "SUCCESS"
            ? "from-green-600 via-green-500 to-emerald-500"
            : "from-blue-600 via-blue-500 to-indigo-500"
        } text-white py-4 relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 animate-bounce" />
                {currentAlertData.icon}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(
                    currentAlertData.severity
                  )} text-white`}
                >
                  {currentAlertData.severity}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{currentAlertData.message}</p>
                <p className="text-sm text-white/90">
                  {currentAlertData.location} • {currentAlertData.time}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-24 px-4 text-center">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-12">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xl rounded-full px-6 py-3 mb-8 border border-white/20">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/90 font-medium">
                System Operational • 99.9% Uptime
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight">
              Protecting Lives,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-orange-400 animate-pulse">
                Saving Communities
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 mb-12 max-w-5xl mx-auto leading-relaxed font-light">
              Next-generation AI-powered disaster management system providing
              <span className="font-bold text-blue-300"> real-time alerts</span>
              ,
              <span className="font-bold text-green-300">
                {" "}
                resource coordination
              </span>
              , and
              <span className="font-bold text-purple-300">
                {" "}
                emergency response
              </span>{" "}
              for safer communities across India.
            </p>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link || "#"}
                className={`group bg-gradient-to-br ${
                  action.color
                } text-white p-8 rounded-3xl font-bold 
                           transition-all duration-500 transform hover:scale-110 hover:shadow-2xl
                           ${
                             action.urgent
                               ? "ring-4 ring-red-300 animate-pulse shadow-red-500/50"
                               : "hover:shadow-xl"
                           }
                           relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                      {action.icon}
                    </div>
                  </div>
                  <div className="text-lg font-bold mb-2">{action.label}</div>
                  <div className="text-sm text-white/80">
                    {action.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Stats Dashboard */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-8 flex items-center justify-center space-x-3">
                <BarChart3 className="w-8 h-8 text-green-400" />
                <span>Live System Dashboard</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
                <div className="text-center group">
                  <div className="text-4xl font-black text-red-400 mb-2 group-hover:scale-110 transition-transform">
                    {statsCounter.activeIncidents}
                  </div>
                  <div className="text-sm text-white/70 font-medium">
                    Active Incidents
                  </div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl font-black text-green-400 mb-2 group-hover:scale-110 transition-transform">
                    {statsCounter.peopleHelped.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/70 font-medium">
                    People Helped
                  </div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl font-black text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                    {statsCounter.responseTime}m
                  </div>
                  <div className="text-sm text-white/70 font-medium">
                    Avg Response
                  </div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl font-black text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                    {statsCounter.sheltersOpen}
                  </div>
                  <div className="text-sm text-white/70 font-medium">
                    Active Shelters
                  </div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl font-black text-yellow-400 mb-2 group-hover:scale-110 transition-transform">
                    {statsCounter.volunteersActive}
                  </div>
                  <div className="text-sm text-white/70 font-medium">
                    Active Volunteers
                  </div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl font-black text-pink-400 mb-2 group-hover:scale-110 transition-transform">
                    {statsCounter.resourcesDeployed}
                  </div>
                  <div className="text-sm text-white/70 font-medium">
                    Resources Deployed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Weather & Features Strip */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weather Widget */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-blue-500/30 rounded-2xl">
                    <Cloud className="w-12 h-12 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold text-white">
                      {weatherData.temp}°C
                    </h3>
                    <p className="text-white/80 text-lg">
                      {weatherData.condition}
                    </p>
                    <p className="text-white/60 text-sm">
                      Palghar, Maharashtra
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-white/80 bg-white/10 rounded-xl p-3">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {weatherData.humidity}% Humidity
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-white/80 bg-white/10 rounded-xl p-3">
                  <Wind className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {weatherData.windSpeed} km/h
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-white/80 bg-white/10 rounded-xl p-3">
                  <Navigation className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {weatherData.visibility}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-white/80 bg-white/10 rounded-xl p-3">
                  <Thermometer className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {weatherData.pressure}
                  </span>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
                >
                  <div className="text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h4 className="text-white font-bold mb-2">{feature.title}</h4>
                  <p className="text-white/70 text-sm mb-3">
                    {feature.description}
                  </p>
                  <div className="text-green-400 font-bold text-sm">
                    {feature.stat}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-full px-6 py-3 mb-8 border border-white/20">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white/90 font-medium">
                Powered by Advanced AI
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-8">
              Next-Generation Disaster Management
            </h2>
            <p className="text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
              Revolutionary technology stack combining artificial intelligence,
              satellite imagery, IoT sensors, and human intelligence for
              unparalleled disaster response capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {services.map((service, index) => (
              <div
                key={index}
                className="group bg-white/5 backdrop-blur-2xl rounded-3xl p-10 border border-white/10 
                           hover:bg-white/10 hover:border-white/30 transition-all duration-700 transform hover:scale-105 
                           hover:shadow-2xl relative overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700`}
                ></div>

                <div className="relative z-10">
                  <div
                    className={`w-24 h-24 bg-gradient-to-br ${service.color} rounded-3xl flex items-center justify-center mb-8 
                                  group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-2xl`}
                  >
                    <div className="text-white">{service.icon}</div>
                  </div>

                  <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-200 transition-all duration-300">
                    {service.title}
                  </h3>

                  <p className="text-white/80 mb-8 leading-relaxed text-lg">
                    {service.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {service.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 text-white/70 group-hover:text-white transition-colors"
                      >
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {Object.entries(service.stats).map(([key, value], idx) => (
                      <div
                        key={idx}
                        className="text-center bg-white/5 rounded-xl p-4 group-hover:bg-white/10 transition-colors"
                      >
                        <div className="text-2xl font-bold text-white mb-1">
                          {value}
                        </div>
                        <div className="text-xs text-white/60 capitalize">
                          {key}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="w-full bg-gradient-to-r from-white/10 to-white/20 hover:from-white/20 hover:to-white/30 
                                   text-white py-4 rounded-2xl font-bold transition-all duration-300 
                                   group-hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-8">
              Trusted by Heroes
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Hear from the frontline responders who rely on DisasterShield to
              save lives every day.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-12 border border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-green-600/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-8">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-8 h-8 text-yellow-400 fill-current"
                  />
                ))}
              </div>

              <blockquote className="text-2xl md:text-3xl text-white text-center mb-8 leading-relaxed font-light italic">
                "{currentTestimonialData.message}"
              </blockquote>

              <div className="flex items-center justify-center space-x-4">
                <div className="text-4xl">{currentTestimonialData.image}</div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {currentTestimonialData.name}
                  </div>
                  <div className="text-white/70">
                    {currentTestimonialData.role}
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? "bg-white scale-125"
                        : "bg-white/30"
                    }`}
                    onClick={() => setCurrentTestimonial(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Data Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-green-600/20 backdrop-blur-xl rounded-full px-6 py-3 mb-8 border border-green-500/30">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/90 font-medium">
                Live Data Stream
              </span>
            </div>
            <h2 className="text-5xl font-black text-white mb-8">
              Real-Time Intelligence
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Advanced monitoring systems providing continuous situational
              awareness across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 hover:border-red-400/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <AlertTriangle className="w-12 h-12 text-red-400" />
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-400">HIGH</div>
                  <div className="text-sm text-white/70">Risk Level</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-white/80">
                  <span>Cyclone Alert</span>
                  <span className="text-red-400 font-bold">Active</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Affected Areas</span>
                  <span>3 Districts</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>ETA</span>
                  <span>6 Hours</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <Satellite className="w-12 h-12 text-blue-400" />
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-400">24/7</div>
                  <div className="text-sm text-white/70">Monitoring</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-white/80">
                  <span>Satellites Active</span>
                  <span className="text-green-400 font-bold">12</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Data Points</span>
                  <span>2.1M/hr</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Coverage</span>
                  <span>100% India</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-8 border border-green-500/30 hover:border-green-400/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <Users className="w-12 h-12 text-green-400" />
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">156</div>
                  <div className="text-sm text-white/70">Volunteers</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-white/80">
                  <span>On Standby</span>
                  <span className="text-green-400 font-bold">89</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Deployed</span>
                  <span>67</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Response Time</span>
                  <span>4.2 min</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <Database className="w-12 h-12 text-purple-400" />
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-400">AI</div>
                  <div className="text-sm text-white/70">Processing</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-white/80">
                  <span>Accuracy</span>
                  <span className="text-green-400 font-bold">94.7%</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Models Active</span>
                  <span>8</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Predictions</span>
                  <span>Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-gradient-to-br from-red-600/20 via-purple-600/20 to-blue-600/20 backdrop-blur-2xl rounded-3xl p-16 border border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-purple-500/10 to-blue-500/10"></div>
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black text-white mb-8">
                Join the Shield
              </h2>
              <p className="text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed">
                Be part of India's most advanced disaster management network.
                Whether you're a first responder, government official, or
                concerned citizen - there's a place for you in our mission to
                save lives.
              </p>

              <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                <Link
                  to="/sos"
                  className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 
                                 text-white px-12 py-6 rounded-full font-bold text-xl transition-all duration-300 
                                 transform hover:scale-110 shadow-2xl hover:shadow-red-500/50 ring-2 ring-red-500/30 hover:ring-red-400/60
                                 flex items-center space-x-3"
                >
                  <Shield className="w-6 h-6" />
                  <span>Get Started Now</span>
                  <ArrowRight className="w-6 h-6" />
                </Link>

                <button
                  className="bg-white/10 hover:bg-white/20 text-white px-12 py-6 rounded-full font-bold text-xl 
                                 transition-all duration-300 transform hover:scale-105 border border-white/30 hover:border-white/50
                                 flex items-center space-x-3"
                >
                  <PlayCircle className="w-6 h-6" />
                  <span>Watch Demo</span>
                </button>
              </div>

              <div className="flex justify-center space-x-8 mt-12 text-white/60">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Free for NGOs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Instant Setup</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-2xl border-t border-white/10 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Shield className="w-10 h-10 text-red-500" />
                <span className="text-2xl font-bold text-white">
                  DisasterShield
                </span>
              </div>
              <p className="text-white/70 leading-relaxed">
                Advanced AI-powered disaster management system protecting
                communities across India 24/7.
              </p>
              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                  <Globe className="w-6 h-6 text-white/80" />
                </div>
                <div className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                  <MessageSquare className="w-6 h-6 text-white/80" />
                </div>
                <div className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                  <Phone className="w-6 h-6 text-white/80" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-lg mb-6">Services</h3>
              <div className="space-y-4">
                <a
                  href="#"
                  className="block text-white/70 hover:text-white transition-colors"
                >
                  Emergency Alerts
                </a>
                <a
                  href="#"
                  className="block text-white/70 hover:text-white transition-colors"
                >
                  Resource Management
                </a>
                <a
                  href="#"
                  className="block text-white/70 hover:text-white transition-colors"
                >
                  Volunteer Network
                </a>
                <a
                  href="#"
                  className="block text-white/70 hover:text-white transition-colors"
                >
                  Command Center
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-lg mb-6">Resources</h3>
              <div className="space-y-4">
                <a
                  href="#"
                  className="block text-white/70 hover:text-white transition-colors"
                >
                  Documentation
                </a>
                <a
                  href="#"
                  className="block text-white/70 hover:text-white transition-colors"
                >
                  Training Materials
                </a>
                <a
                  href="#"
                  className="block text-white/70 hover:text-white transition-colors"
                >
                  API Reference
                </a>
                <a
                  href="#"
                  className="block text-white/70 hover:text-white transition-colors"
                >
                  Best Practices
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-lg mb-6">
                Emergency Contacts
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-white/70">
                  <Phone className="w-5 h-5 text-red-400" />
                  <span>112 (National Emergency)</span>
                </div>
                <div className="flex items-center space-x-3 text-white/70">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span>1078 (Disaster Helpline)</span>
                </div>
                <div className="flex items-center space-x-3 text-white/70">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <span>support@disastershield.in</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-white/60 mb-4 md:mb-0">
                © 2025 DisasterShield. Built for India, by Indians. All rights
                reserved.
              </div>
              <div className="flex space-x-8">
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
