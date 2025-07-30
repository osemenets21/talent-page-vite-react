import React, { useState, useRef } from "react";

export default function EditProfile({ profile, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...profile });
  const [fileInputs, setFileInputs] = useState({ photo: null, taxForm: null });
  const photoInputRef = useRef();
  const taxFormInputRef = useRef();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFileInputs((prev) => ({ ...prev, [name]: files[0] }));
  };

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

  const uploadFolder = `${form.firstName}_${form.lastName}`;
  const backendBase = "http://localhost:8000";
  const photoUrl = profile.files?.photo
    ? `${backendBase}/backend/uploads/${uploadFolder}/${profile.files.photo}`
    : null;
  const pdfUrl = profile.files?.taxForm
    ? `${backendBase}/backend/uploads/${uploadFolder}/${profile.files.taxForm}`
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form, fileInputs);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
        {fields.map((f) => {
          if (f.name === "venmo" && form.paymentMethod !== "Venmo") return null;
          if (f.name === "zelle" && form.paymentMethod !== "Zelle") return null;
          if (f.name === "roleOther" && !form.roleOther) return null;
          if (f.name === "bio") {
            return (
              <div key={f.name} className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-600">
                  {f.label}:
                </label>
                <textarea
                  name={f.name}
                  value={form[f.name] ?? ""}
                  onChange={handleInputChange}
                  className="w-full border rounded px-2 py-1 mt-1"
                  rows={3}
                />
              </div>
            );
          }
          return (
            <div key={f.name}>
              <label className="block text-sm font-semibold text-gray-600">
                {f.label}:
              </label>
              <input
                type={f.type || "text"}
                name={f.name}
                value={form[f.name] ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
          );
        })}
        {/* Photo */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-600">
            Photo:
          </label>
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
            ref={photoInputRef}
          />
        </div>
        {/* Tax Form */}
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
            ref={taxFormInputRef}
          />
        </div>
      </div>
      <div className="mt-10 flex justify-center gap-4">
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
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
