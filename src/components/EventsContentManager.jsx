import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

// API Configuration
const API_BASE_URL = "http://localhost/talent-backend/api.php";

export default function EventsContentManager() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    club: "District Eagle",
    event_name: "",
    event_date: "",
    start_hour: "",
    end_hour: "",
    cover_start_time: "",
    cover_value: "",
    event_description: "",
    ticket_link: "",
    additional_information: "",
    eagle_xl: "No",
    status: "draft",
  });
  const [formErrors, setFormErrors] = useState({});

  // Function to format date and time to New York timezone
  const formatDateNY = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTimeNY = (timeString) => {
    try {
      // Create a date object with the time for today in NY timezone
      const today = new Date();
      const [hours, minutes] = timeString.split(":");
      today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      return today.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return timeString;
    }
  };

  const formatDateTimeNY = (dateString, timeString) => {
    try {
      const [year, month, day] = dateString.split("-");
      const [hours, minutes] = timeString.split(":");
      const dateTime = new Date(year, month - 1, day, hours, minutes);

      return dateTime.toLocaleString("en-US", {
        timeZone: "America/New_York",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return `${dateString} ${timeString}`;
    }
  };

  // Get current date in New York timezone for form defaults
  const getCurrentDateNY = () => {
    const now = new Date();
    return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // en-CA gives YYYY-MM-DD format
  };

  // Get current time in New York timezone
  const getCurrentTimeNY = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // API Functions
  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}?route=events`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.events);
      } else {
        setError("Failed to load events");
      }
    } catch (err) {
      console.error("Error loading events:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData) => {
    setLoading(true);
    setError(null);
    try {
      // Convert form data to API format
      const apiData = {
        club: eventData.club,
        event_name: eventData.event_name,
        event_date: eventData.event_date,
        doors_open_time: eventData.cover_start_time,
        show_start_time: eventData.start_hour,
        show_end_time: eventData.end_hour,
        cover_charge: eventData.cover_value
          ? `$${eventData.cover_value}`
          : "Free",
        cover_charge_details: eventData.cover_value
          ? `$${eventData.cover_value} cover charge`
          : "No cover charge",
        advance_tickets_url: eventData.ticket_link || "",
        eagle_xl:
          eventData.eagle_xl === "Yes" ? eventData.additional_information : "",
        short_description: eventData.event_description,
        long_description: eventData.additional_information,
      };

      const response = await fetch(`${API_BASE_URL}?route=events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (data.success) {
        await loadEvents(); // Reload to get the new event with server-assigned ID
        return true;
      } else {
        setError(data.message || "Failed to create event");
        return false;
      }
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId, eventData) => {
    setLoading(true);
    setError(null);
    try {
      // Convert form data to API format
      const apiData = {
        club: eventData.club,
        event_name: eventData.event_name,
        event_date: eventData.event_date,
        doors_open_time: eventData.cover_start_time,
        show_start_time: eventData.start_hour,
        show_end_time: eventData.end_hour,
        cover_charge: eventData.cover_value
          ? `$${eventData.cover_value}`
          : "Free",
        cover_charge_details: eventData.cover_value
          ? `$${eventData.cover_value} cover charge`
          : "No cover charge",
        advance_tickets_url: eventData.ticket_link || "",
        eagle_xl:
          eventData.eagle_xl === "Yes" ? eventData.additional_information : "",
        short_description: eventData.event_description,
        long_description: eventData.additional_information,
      };

      const response = await fetch(`${API_BASE_URL}?route=events&id=${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (data.success) {
        await loadEvents(); // Reload to get updated data
        return true;
      } else {
        setError(data.message || "Failed to update event");
        return false;
      }
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Failed to update event");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}?route=events&id=${eventId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await loadEvents(); // Reload to reflect deletion
        return true;
      } else {
        setError(data.message || "Failed to delete event");
        return false;
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      setError("Failed to delete event");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!formData.club) errors.club = "Club is required";
    if (!formData.event_name.trim())
      errors.event_name = "Event name is required";
    if (!formData.event_date) errors.event_date = "Event date is required";
    if (!formData.start_hour) errors.start_hour = "Start time is required";
    if (!formData.end_hour) errors.end_hour = "End time is required";
    if (!formData.cover_start_time)
      errors.cover_start_time = "Cover start time is required";
    if (!formData.event_description.trim())
      errors.event_description = "Event description is required";

    // Cover value validation
    if (!formData.cover_value) {
      errors.cover_value = "Cover value is required";
    } else if (
      isNaN(formData.cover_value) ||
      parseFloat(formData.cover_value) < 0
    ) {
      errors.cover_value = "Cover value must be a valid positive number";
    }

    // URL validation
    if (formData.ticket_link && !isValidUrl(formData.ticket_link)) {
      errors.ticket_link =
        "Please enter a valid URL (e.g., https://example.com)";
    }

    // Time validation
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (formData.start_hour && !timeRegex.test(formData.start_hour)) {
      errors.start_hour = "Please use HH:MM format (e.g., 20:00)";
    }
    if (formData.end_hour && !timeRegex.test(formData.end_hour)) {
      errors.end_hour = "Please use HH:MM format (e.g., 02:00)";
    }
    if (
      formData.cover_start_time &&
      !timeRegex.test(formData.cover_start_time)
    ) {
      errors.cover_start_time = "Please use HH:MM format (e.g., 20:00)";
    }

    return errors;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    let success = false;

    if (editingEvent) {
      // Update existing event
      success = await updateEvent(editingEvent.id, formData);
      if (success) {
        setEditingEvent(null);
      }
    } else {
      // Create new event
      success = await createEvent(formData);
    }

    if (success) {
      // Reset form
      setFormData({
        club: "District Eagle",
        event_name: "",
        event_date: "",
        start_hour: "",
        end_hour: "",
        cover_start_time: "",
        cover_value: "",
        event_description: "",
        ticket_link: "",
        additional_information: "",
        eagle_xl: "No",
        status: "draft",
      });
      setFormErrors({});
      setShowCreateForm(false);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    // Convert API data format back to form format
    setFormData({
      club: event.club || "District Eagle",
      event_name: event.event_name || "",
      event_date: event.event_date || "",
      start_hour: event.show_start_time || "",
      end_hour: event.show_end_time || "",
      cover_start_time: event.doors_open_time || "",
      cover_value: event.cover_charge
        ? event.cover_charge.replace("$", "").replace(/[^0-9.]/g, "")
        : "",
      event_description: event.short_description || "",
      ticket_link: event.advance_tickets_url || "",
      additional_information: event.long_description || "",
      eagle_xl: event.eagle_xl ? "Yes" : "No",
      status: "published", // API events are published
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleDelete = async (eventId) => {
    await deleteEvent(eventId);
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingEvent(null);
    setFormData({
      club: "District Eagle",
      event_name: "",
      event_date: "",
      start_hour: "",
      end_hour: "",
      cover_start_time: "",
      cover_value: "",
      event_description: "",
      ticket_link: "",
      additional_information: "",
      eagle_xl: "No",
      status: "draft",
    });
    setFormErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/admin-dashboard")}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <img
                className="h-12 w-auto"
                src="/src/pictures/logo.png"
                alt="Lucky Hospitality"
              />
              <h1 className="ml-4 text-2xl font-bold text-gray-900">
                Events Content Manager
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Manage Events</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            disabled={loading}
          >
            + Create New Event
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-700">Processing...</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-700">❌ {error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* API Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-green-700">
              🔗 Connected to unified backend: {API_BASE_URL}
            </span>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h3>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                🕐 New York Time (ET/EST)
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Club and Event Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Club *
                  </label>
                  <select
                    name="club"
                    value={formData.club}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.club ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="District Eagle">District Eagle</option>
                    <option value="BUNKER">BUNKER</option>
                  </select>
                  {formErrors.club && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.club}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    name="event_name"
                    value={formData.event_name}
                    onChange={handleInputChange}
                    placeholder="Enter event name"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.event_name
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.event_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.event_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Date and Times */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date * (NY Time)
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    min={getCurrentDateNY()}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.event_date
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    New York timezone
                  </p>
                  {formErrors.event_date && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.event_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time * (NY Time - HH:MM)
                  </label>
                  <input
                    type="time"
                    name="start_hour"
                    value={formData.start_hour}
                    onChange={handleInputChange}
                    placeholder="20:00"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.start_hour
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: 8:00 PM = 20:00
                  </p>
                  {formErrors.start_hour && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.start_hour}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time * (NY Time - HH:MM)
                  </label>
                  <input
                    type="time"
                    name="end_hour"
                    value={formData.end_hour}
                    onChange={handleInputChange}
                    placeholder="02:00"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.end_hour ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: 2:00 AM = 02:00
                  </p>
                  {formErrors.end_hour && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.end_hour}
                    </p>
                  )}
                </div>
              </div>

              {/* Cover Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Start Time * (NY Time - HH:MM)
                  </label>
                  <input
                    type="time"
                    name="cover_start_time"
                    value={formData.cover_start_time}
                    onChange={handleInputChange}
                    placeholder="20:00"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.cover_start_time
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When cover charge begins
                  </p>
                  {formErrors.cover_start_time && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.cover_start_time}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Value * (USD)
                  </label>
                  <input
                    type="number"
                    name="cover_value"
                    value={formData.cover_value}
                    onChange={handleInputChange}
                    placeholder="25"
                    min="0"
                    step="0.01"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.cover_value
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.cover_value && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.cover_value}
                    </p>
                  )}
                </div>
              </div>

              {/* Conditional Eagle XL Field */}
              {formData.club === "District Eagle" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eagle XL
                  </label>
                  <select
                    name="eagle_xl"
                    value={formData.eagle_xl}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              )}

              {/* Event Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Description *
                </label>
                <textarea
                  name="event_description"
                  value={formData.event_description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe the event, performers, special features..."
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formErrors.event_description
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                {formErrors.event_description && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.event_description}
                  </p>
                )}
              </div>

              {/* Ticket Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Link
                </label>
                <input
                  type="url"
                  name="ticket_link"
                  value={formData.ticket_link}
                  onChange={handleInputChange}
                  placeholder="https://tickets.example.com/event-name"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formErrors.ticket_link
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                {formErrors.ticket_link && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.ticket_link}
                  </p>
                )}
              </div>

              {/* Additional Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  name="additional_information"
                  value={formData.additional_information}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Dress code, age restrictions, special notes..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {editingEvent ? "Update Event" : "Create Event"}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Events</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Club
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time (NY)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cover (NY Time)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.event_name}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {event.event_description}
                        </div>
                        {event.eagle_xl === "Yes" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            Eagle XL
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.club === "BUNKER"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {event.club}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatDateNY(event.event_date)}</div>
                      <div className="text-xs text-gray-500">
                        {formatTimeNY(event.show_start_time)} -{" "}
                        {formatTimeNY(event.show_end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{event.cover_charge}</div>
                      <div className="text-xs text-gray-500">
                        from {formatTimeNY(event.doors_open_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.status === "active"
                            ? "bg-green-100 text-green-800"
                            : event.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : event.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                      {event.ticket_link && (
                        <a
                          href={event.ticket_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 ml-4"
                        >
                          Tickets
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
