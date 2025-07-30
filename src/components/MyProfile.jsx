import React, { useEffect, useState, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [fileInputs, setFileInputs] = useState({ photo: null, taxForm: null });
  const photoInputRef = useRef();
  const taxFormInputRef = useRef();

  const handleEdit = () => setEditMode(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFileInputs((prev) => ({ ...prev, [name]: files[0] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("submissionId", profile.submissionId);
      if (fileInputs.photo) formData.append("photo", fileInputs.photo);
      if (fileInputs.taxForm) formData.append("taxForm", fileInputs.taxForm);
      const res = await fetch(`http://localhost:8000/backend/edit_talent.php`, {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      console.log("Raw response:", text);
      try {
        const result = JSON.parse(text);
        // ...
      } catch (err) {
        alert("Invalid JSON: " + text);
      }
      if (result.status === "success") {
        setEditMode(false);
        window.location.reload();
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
      console.error("Logout failed:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your profile?"))
      return;
    setSaving(true);
    try {
      const res = await fetch(
        `http://localhost:8000/backend/delete_talent.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId: profile.submissionId }),
        }
      );
      const text = await res.text();
      console.log("Raw response:", text);
      try {
        const result = JSON.parse(text);
        // ...
      } catch (err) {
        alert("Invalid JSON: " + text);
      }

      if (result.status === "success") {
        alert("Profile deleted.");
        window.location.href = "/";
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
      `http://localhost:8000/backend/get_talent.php?submissionId=${encodeURIComponent(
        submissionId
      )}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile data");
        return res.json();
      })
      .then((data) => {
        if (!data || data.status === "error" || !data.submissionId) {
          setError(data.message || "Profile not found.");
        } else {
          setProfile(data);
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

  const uploadFolder = `${profile.firstName}_${profile.lastName}`;
  const backendBase = "http://localhost:8000";
  const photoUrl = profile.files?.photo
    ? `${backendBase}/backend/uploads/${uploadFolder}/${profile.files.photo}`
    : null;
  const pdfUrl = profile.files?.taxForm
    ? `${backendBase}/backend/uploads/${uploadFolder}/${profile.files.taxForm}`
    : null;

  // Editable fields config
  const fields = [
    { name: "firstName", label: "First Name" },
    { name: "lastName", label: "Last Name" },
    { name: "performerName", label: "Stage Name" },
    { name: "phone", label: "Phone" },
    { name: "email", label: "Email", type: "email" },
    { name: "instagram", label: "Instagram" },
    { name: "facebook", label: "Facebook" },
    { name: "soundcloud", label: "SoundCloud" },
    { name: "spotify", label: "Spotify" },
    { name: "youtube", label: "YouTube" },
    { name: "tiktok", label: "Tiktok" },
    { name: "city", label: "City" },
    { name: "country", label: "Country" },
    { name: "role", label: "Role" },
    { name: "roleOther", label: "Role (Other)" },
    { name: "paymentMethod", label: "Payment Method" },
    { name: "venmo", label: "Venmo" },
    { name: "zelle", label: "Zelle" },
    { name: "bio", label: "Bio", type: "textarea" },
  ];

  return (
    <div className="relative max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 mt-10">
      <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
        My Profile
      </h2>
      <div className="absolute top-3 right-3 z-10">
        <button onClick={handleLogout} title="Logout" type="button">
          <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-red-600 transition duration-150" />
        </button>
      </div>

      {/* Photo */}
      <div className="flex justify-center mb-6">
        {editMode ? (
          <div>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Profile"
                className="w-36 h-36 rounded-full object-cover ring-4 ring-indigo-300 mb-2"
              />
            )}
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          photoUrl && (
            <img
              src={photoUrl}
              alt="Profile"
              className="w-36 h-36 rounded-full object-cover ring-4 ring-indigo-300"
            />
          )
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
          {fields.map((f) => {
            if (f.name === "venmo" && profile.paymentMethod !== "Venmo")
              return null;
            if (f.name === "zelle" && profile.paymentMethod !== "Zelle")
              return null;
            if (f.name === "roleOther" && !profile.roleOther) return null;
            if (f.name === "bio") {
              return editMode ? (
                <div key={f.name} className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600">
                    {f.label}:
                  </label>
                  <textarea
                    name={f.name}
                    value={form[f.name] ?? profile[f.name] ?? ""}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1 mt-1"
                    rows={3}
                  />
                </div>
              ) : (
                <div key={f.name} className="sm:col-span-2">
                  <span className="block text-sm font-semibold text-gray-600">
                    {f.label}:
                  </span>
                  <p className="text-sm mt-1 text-gray-800 whitespace-pre-wrap">
                    {profile[f.name]}
                  </p>
                </div>
              );
            }
            return editMode ? (
              <div key={f.name}>
                <label className="block text-sm font-semibold text-gray-600">
                  {f.label}:
                </label>
                <input
                  type={f.type || "text"}
                  name={f.name}
                  value={form[f.name] ?? profile[f.name] ?? ""}
                  onChange={handleInputChange}
                  className="w-full border rounded px-2 py-1 mt-1"
                />
              </div>
            ) : (
              <ProfileItem
                key={f.name}
                label={f.label}
                value={profile[f.name]}
              />
            );
          })}
          {/* Tax Form */}
          {editMode ? (
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-600">
                Tax Form (PDF):
              </label>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline text-sm mt-1 inline-block mr-2"
                >
                  Download Current
                </a>
              )}
              <input
                type="file"
                name="taxForm"
                accept="application/pdf"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            pdfUrl && (
              <div className="sm:col-span-2">
                <span className="block text-sm font-semibold text-gray-600">
                  Tax Form (PDF):
                </span>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline text-sm mt-1 inline-block"
                >
                  Download
                </a>
              </div>
            )
          )}
        </div>

        <div className="mt-10 flex justify-center gap-4">
          {editMode ? (
            <>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow hover:bg-green-600 transition"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-gray-400 text-white text-sm font-medium shadow hover:bg-gray-500 transition"
                onClick={() => setEditMode(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </form>
    </div>
  );
}

function ProfileItem({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <span className="block text-sm font-semibold text-gray-600">
        {label}:
      </span>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}
