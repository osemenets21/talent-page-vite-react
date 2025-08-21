import React, { useEffect, useState, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import EditProfile from "./EditProfile";





export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [shouldReload, setShouldReload] = useState(false);
  // Function to format timestamp to American format
  const formatAmericanTimestamp = (timestamp) => {
    if (!timestamp) return "no data";
    
    try {
      // Parse the timestamp (assuming it's in YYYY-MM-DD HH:mm:ss format)
      const date = new Date(timestamp);
      
      // Format to NYC Eastern Time standard (MM/DD/YYYY, HH:MM:SS AM/PM)
      return date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timestamp; // Return original if parsing fails
    }
  };

  const handleEdit = () => setEditMode(true);

  const handleSave = async (form, fileInputs) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("submissionId", profile.submissionId);
      if (fileInputs.photo) formData.append("photo", fileInputs.photo);
      if (fileInputs.taxForm) formData.append("taxForm", fileInputs.taxForm);
      const res = await fetch(`${import.meta.env.VITE_API_DOMAIN}/talent/edit`, {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        alert("Invalid JSON: " + text);
        setSaving(false);
        return;
      }
      if (result.status === "success") {
        setEditMode(false);
        setModalTitle("Profile changed");
        setModalMessage("Your profile info has been updated");
        setShowModal(true);
        setShouldReload(true);
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    setSaving(false);
  };



  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      // Logout failed - handle silently
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your profile?")) return;
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_DOMAIN}/talent/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: profile.submissionId }),
      });
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        alert("Invalid JSON: " + text);
        setSaving(false);
        return;
      }
      if (result.status === "success") {
        setModalTitle("Profile deleted");
        setModalMessage("Your profile has been deleted");
        setShowModal(true);
        handleLogout(); 
      } else {
        alert(result.message || "Failed to delete profile");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    setSaving(false);
  };

  useEffect(() => {
    const submissionId = localStorage.getItem("submissionId");
    if (!submissionId) {
      setError("No submission ID found. Please submit your profile first.");
      setLoading(false);
      return;
    }

    fetch(
      `${import.meta.env.VITE_API_DOMAIN}/talent/get?submissionId=${encodeURIComponent(
        submissionId
      )}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile data");
        return res.json();
      })
      .then((res) => {
        if (!res || res.status === "error" || !res.data.submissionId) {
          setError(res.data.message || "Profile not found.");
        } else {
          setProfile(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div className="text-center py-16 text-gray-500">Loading...</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!profile) return null;

  const backendBase = import.meta.env.VITE_API_DOMAIN;
  const photoUrl = profile.files?.photo
    ? `${backendBase}/uploads/${profile.submissionId}/${profile.files.photo}`
    : null;
  const pdfUrl = profile.files?.taxForm
    ? `${backendBase}/uploads/${profile.submissionId}/${profile.files.taxForm}`
    : null;
  const performerImages = Array.isArray(profile.files?.performerImages)
    ? profile.files.performerImages
    : [];
 

  return (
    <div className="relative max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 mt-10">
      <h2 className="text-3xl font-bold text-yellow-500 mb-6 text-center">
        Welcome, {profile.firstName || ''}
      </h2>
      <div className="absolute top-3 right-3 z-10">
        <button onClick={handleLogout} title="Logout" type="button">
          <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-red-600 transition duration-150" />
        </button>
      </div>

      {/* Photo */}
      {!editMode && photoUrl && (
        <div className="flex justify-center mb-6">
          <img
            src={photoUrl}
            alt="Profile"
            className="w-36 h-36 rounded-full object-cover ring-4 ring-indigo-300"
          />
        </div>
      )}

      {editMode ? (
        <EditProfile
          profile={profile}
          onSave={handleSave}
          onCancel={() => setEditMode(false)}
          saving={saving}
        />
      ) : (
        <>
          {/* Profile fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700 mb-8">
            {Object.entries(profile).map(([key, value]) => {

              if (key === "files" || key === "submissionId" || key === "timestamp" || key === "portfolio" || key === "mysql_data") return null;
              
              // Special handling for updated_at field
              if (key === "updated_at") {
                const formattedTime = formatAmericanTimestamp(value);
                return <ProfileItem key={key} label="Last Updated" value={formattedTime} />;
              }
              
              const displayValue = value === null || value === undefined || value === "" ? "no data" : value;
              return <ProfileItem key={key} label={key} value={displayValue} />;
            })}
            {/* Photo */}
            {photoUrl && (
              <div className="sm:col-span-2">
                <span className="block text-sm font-semibold text-gray-600">Profile Photo:</span>
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-indigo-300 mt-2"
                />
              </div>
            )}
            {/* Performer Images */}
            {performerImages.length > 0 && (
              <div className="sm:col-span-2">
                <span className="block text-sm font-semibold text-gray-600">Performer Images:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {performerImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={`${backendBase}/uploads/${profile.submissionId}/${img}`}
                      alt={`Performer ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg ring-1 ring-indigo-200"
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Tax Form */}
            {pdfUrl && (
              <div className="sm:col-span-2">
                <span className="block text-sm font-semibold text-gray-600">Tax Form (PDF):</span>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline text-sm mt-1 inline-block"
                >
                  Download
                </a>
              </div>
            )}
          </div>
          <div className="mt-10 flex justify-center gap-4">
            <button
              type="button"
              onClick={handleEdit}
              className="px-6 py-2 rounded-lg bg-yellow-400 text-white text-sm font-medium shadow hover:bg-indigo-700 transition"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-2 rounded-lg bg-red-500 text-white text-sm font-medium shadow hover:bg-red-600 transition"
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </>
      )}
      <Modal
        open={showModal}
        setOpen={(open) => {
          setShowModal(open);
          if (!open && shouldReload) {
            if (shouldReload === "redirect") {
              setShouldReload(false);
              navigate("/");
            } else {
              setShouldReload(false);
              window.location.reload();
            }
          }
        }}
        title={modalTitle}
        message={modalMessage}
      />
    </div>
  );
}

function ProfileItem({ label, value }) {
  const isPlaceholder = value === "no data";
  const isLongText = value && value.length > 100; // Consider text long if over 100 characters
  
  return (
    <div className={isLongText ? "sm:col-span-2" : ""}>
      <span className="block text-sm font-semibold text-gray-600">
        {label}:
      </span>
      <p className={`text-sm ${isPlaceholder ? "text-gray-400 italic" : "text-gray-800"} ${
        isLongText ? "break-words whitespace-pre-wrap leading-relaxed" : ""
      }`}>
        {value}
      </p>
    </div>
  );
}
