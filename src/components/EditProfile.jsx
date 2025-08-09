import React, { useState, useRef } from "react";
import FileUpload from "./FileUpload";
import getCroppedImg from "../utils/cropImage";
import PhotoCropModal from "./PhotoCropModal";

export default function EditProfile({ profile, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...profile });
  const [fileInputs, setFileInputs] = useState({ photo: null, taxForm: null, performerImages: [] });
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawPhotoFile, setRawPhotoFile] = useState(null);
  const [croppedPhoto, setCroppedPhoto] = useState(null);
  const [croppedPhotoFile, setCroppedPhotoFile] = useState(null);
  const [bioError, setBioError] = useState("");

  // Function to validate bio text to prevent repetitive content
  const validateBioText = (text) => {
    if (!text || text.length < 3) return { isValid: true, error: "" };
    
    // Check for repetitive characters (more than 10 consecutive same characters)
    const repetitiveChars = /(.)\1{9,}/;
    if (repetitiveChars.test(text)) {
      return { isValid: false, error: "Bio cannot contain more than 10 consecutive same characters" };
    }
    
    // Check for repetitive words (same word repeated more than 5 times)
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = {};
    for (const word of words) {
      if (word.length > 1) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
        if (wordCounts[word] > 5) {
          return { isValid: false, error: "Bio cannot repeat the same word more than 5 times" };
        }
      }
    }
    
    // Check for repetitive phrases (3+ word phrases repeated more than 2 times)
    const phrases = [];
    for (let i = 0; i <= words.length - 3; i++) {
      phrases.push(words.slice(i, i + 3).join(' '));
    }
    const phraseCounts = {};
    for (const phrase of phrases) {
      phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
      if (phraseCounts[phrase] > 2) {
        return { isValid: false, error: "Bio cannot repeat the same phrase more than 2 times" };
      }
    }
    
    return { isValid: true, error: "" };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Validate bio field specifically
    if (name === "bio") {
      const validation = validateBioText(value);
      setBioError(validation.error);
    }
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

  const backendBase = import.meta.env.VITE_API_DOMAIN;
  const photoUrl = profile.files?.photo
    ? `${backendBase}/backend/uploads/${profile.submissionId}/${profile.files.photo}`
    : null;
  const pdfUrl = profile.files?.taxForm
    ? `${backendBase}/backend/uploads/${profile.submissionId}/${profile.files.taxForm}`
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate bio text before submitting
    const bioValidation = validateBioText(form.bio);
    if (!bioValidation.isValid) {
      alert(bioValidation.error);
      return;
    }
    
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("submissionId", form.submissionId);
    if (croppedPhotoFile) {
      console.log('Adding croppedPhotoFile to FormData:', {
        name: croppedPhotoFile.name,
        size: croppedPhotoFile.size,
        type: croppedPhotoFile.type
      });
      formData.append("photo", croppedPhotoFile);
    } else if (fileInputs.photo) {
      formData.append("photo", fileInputs.photo);
    }
    if (fileInputs.taxForm) formData.append("taxForm", fileInputs.taxForm);
    if (fileInputs.performerImages && fileInputs.performerImages.length > 0) {
      fileInputs.performerImages.forEach((file) => {
        formData.append("performerImages[]", file);
      });
    }
    
    
    // Send to backend
    try {
      const res = await fetch(`${import.meta.env.VITE_API_DOMAIN}/backend/edit_talent.php`, {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        alert("Invalid JSON: " + text);
        return;
      }
      if (result.status === "success") {
        // if (typeof onSave === "function") onSave(form, fileInputs);
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <>
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
                    className={`w-full border rounded px-2 py-1 mt-1 ${
                      bioError ? 'border-red-300 focus:ring-red-600' : ''
                    }`}
                    rows={3}
                  />
                  {bioError && (
                    <p className="text-xs text-red-500 mt-1">{bioError}</p>
                  )}
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
            <label className="block text-sm font-semibold text-gray-600">Photo:</label>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Profile"
                className="w-36 h-36 rounded-full object-cover ring-4 ring-indigo-300 mb-2"
              />
            )}
            <FileUpload
              label="Profile Photo"
              accept="image/*"
              setFile={(file) => {
                setRawPhotoFile(file);
                setShowCropModal(true);
              }}
              required={false}
            />
          </div>
          {/* Performer Images */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-600">Performer Images:</label>
            {Array.isArray(profile.files?.performerImages) && profile.files.performerImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.files.performerImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={`${backendBase}/backend/uploads/${profile.submissionId}/${img}`}
                    alt={`Performer ${idx + 1}`}
                    className="w-16 h-16 object-cover rounded-lg ring-1 ring-indigo-200"
                  />
                ))}
              </div>
            )}
            <FileUpload
              label="Performer Images"
              accept="image/*"
              setFile={(files) => setFileInputs((prev) => ({ ...prev, performerImages: files }))}
              multiple={true}
              required={false}
            />
          </div>
          {/* Tax Form */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-600">Tax Form (PDF):</label>
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
            <FileUpload
              label="Tax Form (PDF)"
              accept="application/pdf"
              setFile={(file) => setFileInputs((prev) => ({ ...prev, taxForm: file }))}
              required={false}
              renameWithForm={{ firstName: form.firstName, lastName: form.lastName }}
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
      <PhotoCropModal
        open={showCropModal}
        setOpen={setShowCropModal}
        imageFile={rawPhotoFile}
        onCropDone={async (croppedBlob) => {
          // Convert cropped Blob to File with a name
          const fileName = rawPhotoFile?.name || "cropped_photo.jpg";
          const croppedFile = new File([croppedBlob], fileName, { type: croppedBlob.type || "image/jpeg" });
          setCroppedPhoto(croppedBlob);
          setCroppedPhotoFile(croppedFile);
          setShowCropModal(false);
        }}
      />
    </>
  );
}
