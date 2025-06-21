import React, { useState } from "react";
import {
  AlertTriangle,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Save,
  Send,
  AlertCircle,
} from "lucide-react";

const IncidentReportForm = () => {
  const [formData, setFormData] = useState({
    incidentId: `INC-${Date.now()}`,
    reportDate: new Date().toISOString().split("T")[0],
    reportTime: new Date().toTimeString().split(" ")[0].substring(0, 5),
    reporterName: "",
    reporterEmail: "",
    reporterPhone: "",
    reporterDepartment: "",
    incidentDate: "",
    incidentTime: "",
    incidentLocation: "",
    incidentType: "",
    severityLevel: "",
    incidentDescription: "",
    immediateActions: "",
    witnessName: "",
    witnessContact: "",
    injuriesReported: false,
    injuryDetails: "",
    propertyDamage: false,
    damageDetails: "",
    emergencyServicesContacted: false,
    emergencyDetails: "",
    supervisorNotified: false,
    supervisorName: "",
    followUpRequired: false,
    followUpDetails: "",
    additionalComments: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  const incidentTypes = [
    "Workplace Injury",
    "Near Miss",
    "Property Damage",
    "Security Breach",
    "Environmental Incident",
    "Equipment Failure",
    "Fire/Explosion",
    "Chemical Spill",
    "Vehicle Accident",
    "Theft/Vandalism",
    "Other",
  ];

  const severityLevels = [
    {
      value: "low",
      label: "Low - Minor incident, no injuries",
      color: "text-green-600",
    },
    {
      value: "medium",
      label: "Medium - Moderate impact, minor injuries",
      color: "text-yellow-600",
    },
    {
      value: "high",
      label: "High - Serious incident, major injuries",
      color: "text-orange-600",
    },
    {
      value: "critical",
      label: "Critical - Life-threatening, major damage",
      color: "text-red-600",
    },
  ];

  const departments = [
    "Administration",
    "Operations",
    "Maintenance",
    "Security",
    "HR",
    "IT",
    "Finance",
    "Other",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reporterName.trim())
      newErrors.reporterName = "Reporter name is required";
    if (!formData.reporterEmail.trim())
      newErrors.reporterEmail = "Reporter email is required";
    if (!formData.incidentDate)
      newErrors.incidentDate = "Incident date is required";
    if (!formData.incidentTime)
      newErrors.incidentTime = "Incident time is required";
    if (!formData.incidentLocation.trim())
      newErrors.incidentLocation = "Incident location is required";
    if (!formData.incidentType)
      newErrors.incidentType = "Incident type is required";
    if (!formData.severityLevel)
      newErrors.severityLevel = "Severity level is required";
    if (!formData.incidentDescription.trim())
      newErrors.incidentDescription = "Incident description is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.reporterEmail && !emailRegex.test(formData.reporterEmail)) {
      newErrors.reporterEmail = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Incident Report Submitted:", formData);
      setSubmitStatus("success");

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          incidentId: `INC-${Date.now()}`,
          reportDate: new Date().toISOString().split("T")[0],
          reportTime: new Date().toTimeString().split(" ")[0].substring(0, 5),
          reporterName: "",
          reporterEmail: "",
          reporterPhone: "",
          reporterDepartment: "",
          incidentDate: "",
          incidentTime: "",
          incidentLocation: "",
          incidentType: "",
          severityLevel: "",
          incidentDescription: "",
          immediateActions: "",
          witnessName: "",
          witnessContact: "",
          injuriesReported: false,
          injuryDetails: "",
          propertyDamage: false,
          damageDetails: "",
          emergencyServicesContacted: false,
          emergencyDetails: "",
          supervisorNotified: false,
          supervisorName: "",
          followUpRequired: false,
          followUpDetails: "",
          additionalComments: "",
        });
        setSubmitStatus("");
      }, 3000);
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    console.log("Draft saved:", formData);
    setSubmitStatus("draft");
    setTimeout(() => setSubmitStatus(""), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white px-6 py-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Incident Report Form</h1>
                <p className="text-red-100">Report ID: {formData.incidentId}</p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {submitStatus === "success" && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-green-700">
                  Incident report submitted successfully!
                </p>
              </div>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">
                  Please correct the errors below and try again.
                </p>
              </div>
            </div>
          )}

          {submitStatus === "draft" && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-400 mr-2" />
                <p className="text-blue-700">Draft saved successfully!</p>
              </div>
            </div>
          )}

          <div className="p-6 space-y-8">
            {/* Reporter Information */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Reporter Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="reporterName"
                    value={formData.reporterName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.reporterName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.reporterName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.reporterName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    name="reporterDepartment"
                    value={formData.reporterDepartment}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="reporterEmail"
                    value={formData.reporterEmail}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.reporterEmail
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.reporterEmail && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.reporterEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="reporterPhone"
                    value={formData.reporterPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </section>

            {/* Incident Details */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Incident Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incident Date *
                  </label>
                  <input
                    type="date"
                    name="incidentDate"
                    value={formData.incidentDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.incidentDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.incidentDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.incidentDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incident Time *
                  </label>
                  <input
                    type="time"
                    name="incidentTime"
                    value={formData.incidentTime}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.incidentTime ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.incidentTime && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.incidentTime}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Date
                  </label>
                  <input
                    type="date"
                    name="reportDate"
                    value={formData.reportDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incident Type *
                  </label>
                  <select
                    name="incidentType"
                    value={formData.incidentType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.incidentType ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Incident Type</option>
                    {incidentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.incidentType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.incidentType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity Level *
                  </label>
                  <select
                    name="severityLevel"
                    value={formData.severityLevel}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.severityLevel
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Severity Level</option>
                    {severityLevels.map((level) => (
                      <option
                        key={level.value}
                        value={level.value}
                        className={level.color}
                      >
                        {level.label}
                      </option>
                    ))}
                  </select>
                  {errors.severityLevel && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.severityLevel}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incident Location *
                </label>
                <input
                  type="text"
                  name="incidentLocation"
                  value={formData.incidentLocation}
                  onChange={handleInputChange}
                  placeholder="Building, floor, room number, or specific area"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.incidentLocation
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.incidentLocation && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.incidentLocation}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Description of Incident *
                </label>
                <textarea
                  name="incidentDescription"
                  value={formData.incidentDescription}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Provide a detailed description of what happened, including events leading up to the incident..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.incidentDescription
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.incidentDescription && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.incidentDescription}
                  </p>
                )}
              </div>
            </section>

            {/* Immediate Actions */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Immediate Actions Taken
                </h2>
              </div>

              <textarea
                name="immediateActions"
                value={formData.immediateActions}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe any immediate actions taken following the incident (first aid, evacuation, equipment shutdown, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </section>

            {/* Witnesses */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Witness Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Witness Name
                  </label>
                  <input
                    type="text"
                    name="witnessName"
                    value={formData.witnessName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Witness Contact
                  </label>
                  <input
                    type="text"
                    name="witnessContact"
                    value={formData.witnessContact}
                    onChange={handleInputChange}
                    placeholder="Phone or email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </section>

            {/* Injuries and Damage */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Injuries and Damage
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="injuriesReported"
                      checked={formData.injuriesReported}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Injuries were reported
                    </span>
                  </label>

                  {formData.injuriesReported && (
                    <textarea
                      name="injuryDetails"
                      value={formData.injuryDetails}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Describe the injuries and medical attention provided"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="propertyDamage"
                      checked={formData.propertyDamage}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Property damage occurred
                    </span>
                  </label>

                  {formData.propertyDamage && (
                    <textarea
                      name="damageDetails"
                      value={formData.damageDetails}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Describe the property damage and estimated cost if known"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* Emergency Services */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Emergency Response
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="emergencyServicesContacted"
                      checked={formData.emergencyServicesContacted}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Emergency services were contacted
                    </span>
                  </label>

                  {formData.emergencyServicesContacted && (
                    <textarea
                      name="emergencyDetails"
                      value={formData.emergencyDetails}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Which emergency services were contacted and when"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="supervisorNotified"
                      checked={formData.supervisorNotified}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Supervisor/Manager was notified
                    </span>
                  </label>

                  {formData.supervisorNotified && (
                    <input
                      type="text"
                      name="supervisorName"
                      value={formData.supervisorName}
                      onChange={handleInputChange}
                      placeholder="Supervisor/Manager name"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* Follow-up */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Follow-up Actions
              </h2>

              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    name="followUpRequired"
                    checked={formData.followUpRequired}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Follow-up actions are required
                  </span>
                </label>

                {formData.followUpRequired && (
                  <textarea
                    name="followUpDetails"
                    value={formData.followUpDetails}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe recommended follow-up actions, investigations, or preventive measures"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                )}
              </div>
            </section>

            {/* Additional Comments */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Comments
              </h2>

              <textarea
                name="additionalComments"
                value={formData.additionalComments}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any additional information that may be relevant to this incident"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </section>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentReportForm;
