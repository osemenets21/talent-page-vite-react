import React, { useState, useRef } from "react";
import FileUpload from "./FileUpload";
import getCroppedImg from "../utils/cropImage";
import PhotoCropModal from "./PhotoCropModal";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { authenticatedPost } from "../utils/apiUtils";

export default function EditProfile({ profile, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...profile });
  const [fileInputs, setFileInputs] = useState({ photo: null, taxForm: null, performerImages: [] });
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawPhotoFile, setRawPhotoFile] = useState(null);
  const [croppedPhoto, setCroppedPhoto] = useState(null);
  const [croppedPhotoFile, setCroppedPhotoFile] = useState(null);
  const [bioError, setBioError] = useState("");
  const [filesChanged, setFilesChanged] = useState({ photo: false, taxForm: false, performerImages: false });

  // Function to delete individual files
  const handleFileDelete = async (fileType, fileName = null) => {
    if (!window.confirm(`Are you sure you want to delete this ${fileType}?`)) return;

    try {
      const response = await authenticatedPost(`${import.meta.env.VITE_API_DOMAIN}/talent/delete-file`, {
        submissionId: profile.submissionId,
        fileType: fileType,
        fileName: fileName
      });

      const result = await response.json();
      if (result.status === "success") {
        alert(`${fileType} deleted successfully!`);
        window.location.reload();
      } else {
        alert(result.message || `Failed to delete ${fileType}`);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

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
    ? `${backendBase}/uploads/${profile.submissionId}/${profile.files.photo}`
    : null;
  const pdfUrl = profile.files?.taxForm
    ? `${backendBase}/uploads/${profile.submissionId}/${profile.files.taxForm}`
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
    
    // Only append files if they were actually selected/changed
    if (filesChanged.photo && (croppedPhotoFile || fileInputs.photo)) {
      const photoFile = croppedPhotoFile || fileInputs.photo;
      
      // Ensure consistent naming for profile photo
      let renamedPhotoFile;
      if (photoFile.name === "profile_photo.jpg") {
        // Already correctly named from cropping
        renamedPhotoFile = photoFile;
      } else {
        // Rename to consistent format
        const photoExtension = photoFile.name.split('.').pop();
        renamedPhotoFile = new File([photoFile], `profile_photo.${photoExtension}`, {
          type: photoFile.type
        });
      }
      
      console.log('Appending photo file:', renamedPhotoFile?.name, renamedPhotoFile?.size);
      formData.append("photo", renamedPhotoFile);
    }
    
    if (filesChanged.taxForm && fileInputs.taxForm) {
      // Rename tax form to consistent format
      const taxFormExtension = fileInputs.taxForm.name.split('.').pop();
      const renamedTaxForm = new File([fileInputs.taxForm], `tax_form.${taxFormExtension}`, {
        type: fileInputs.taxForm.type
      });
      console.log('Appending tax form:', renamedTaxForm?.name);
      formData.append("taxForm", renamedTaxForm);
    }
    
    if (filesChanged.performerImages && fileInputs.performerImages && fileInputs.performerImages.length > 0) {
      console.log('Appending performer images:', fileInputs.performerImages.length);
      // Rename performer images with consistent numbering
      fileInputs.performerImages.forEach((file, index) => {
        const fileExtension = file.name.split('.').pop();
        const renamedFile = new File([file], `performer_${index + 1}.${fileExtension}`, {
          type: file.type
        });
        formData.append("performerImages[]", renamedFile);
      });
    }
    
    // Send to backend
    try {
      const res = await authenticatedPost(`${import.meta.env.VITE_API_DOMAIN}/talent/edit`, formData);
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        alert("Invalid JSON: " + text);
        return;
      }
      if (result.status === "success") {
        alert("Profile updated successfully!");
        // Reload the page to show updated data
        window.location.reload();
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
        {/* Public Information Section */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Edit Public Profile Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
            {/* Public fields */}
            <div>
              <label className="block text-sm font-semibold text-gray-600">First Name:</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Last Name:</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Stage / Performer Name:</label>
              <input
                type="text"
                name="performerName"
                value={form.performerName ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Your Role:</label>
              <input
                type="text"
                name="role"
                value={form.role ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            {form.roleOther && (
              <div>
                <label className="block text-sm font-semibold text-gray-600">Role (Other):</label>
                <input
                  type="text"
                  name="roleOther"
                  value={form.roleOther ?? ""}
                  onChange={handleInputChange}
                  className="w-full border rounded px-2 py-1 mt-1"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-600">Instagram:</label>
              <input
                type="text"
                name="instagram"
                value={form.instagram ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Facebook:</label>
              <input
                type="text"
                name="facebook"
                value={form.facebook ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">SoundCloud:</label>
              <input
                type="text"
                name="soundcloud"
                value={form.soundcloud ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Spotify:</label>
              <input
                type="text"
                name="spotify"
                value={form.spotify ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">YouTube:</label>
              <input
                type="text"
                name="youtube"
                value={form.youtube ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Tiktok:</label>
              <input
                type="text"
                name="tiktok"
                value={form.tiktok ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">City of Origin:</label>
              <input
                type="text"
                name="city"
                value={form.city ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Country:</label>
              <input
                type="text"
                name="country"
                value={form.country ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            
            {/* Brief BIO - full width */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-600">Brief BIO:</label>
              <textarea
                name="bio"
                value={form.bio ?? ""}
                onChange={handleInputChange}
                maxLength={1500}
                className={`w-full border rounded px-2 py-1 mt-1 ${
                  bioError ? 'border-red-300 focus:ring-red-600' : ''
                }`}
                rows={3}
                placeholder="Tell us about yourself... (Max 1500 characters)"
              />
              <div className="flex justify-between items-center mt-1">
                {bioError && (
                  <p className="text-xs text-red-500">{bioError}</p>
                )}
                <p className={`text-xs ml-auto ${
                  (form.bio ?? "").length > 1400 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {(form.bio ?? "").length}/1500 characters
                </p>
              </div>
            </div>

            {/* Profile Photo */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-600">Profile Photo:</label>
              {photoUrl && (
                <div className="relative inline-block">
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-36 h-36 rounded-full object-cover ring-4 ring-indigo-300 mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleFileDelete("photo")}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                    title="Delete photo"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              <FileUpload
                label="Profile Photo"
                accept="image/*"
                setFile={(file) => {
                  setRawPhotoFile(file);
                  setShowCropModal(true);
                  setFilesChanged(prev => ({ ...prev, photo: true }));
                }}
                required={false}
              />
            </div>

            {/* Performer Images */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-600">Performer Images / LOGO:</label>
              {Array.isArray(profile.files?.performerImages) && profile.files.performerImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.files.performerImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={`${backendBase}/uploads/${profile.submissionId}/${img}`}
                        alt={`Performer ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded-lg ring-1 ring-indigo-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleFileDelete("performerImage", img)}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-lg transition-colors"
                        title="Delete image"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <FileUpload
                label="Performer Images"
                accept="image/*"
                setFile={(files) => {
                  setFileInputs((prev) => ({ ...prev, performerImages: files }));
                  setFilesChanged(prev => ({ ...prev, performerImages: true }));
                }}
                multiple={true}
                required={false}
              />
            </div>
          </div>
        </div>

        {/* Private Information Section */}
        <div className="bg-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
            Edit Private Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Phone:</label>
              <input
                type="text"
                name="phone"
                value={form.phone ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Email:</label>
              <input
                type="email"
                name="email"
                value={form.email ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Form of Payment:</label>
              <input
                type="text"
                name="paymentMethod"
                value={form.paymentMethod ?? ""}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </div>
            {form.paymentMethod === "Venmo" && (
              <div>
                <label className="block text-sm font-semibold text-gray-600">Venmo Name:</label>
                <input
                  type="text"
                  name="venmo"
                  value={form.venmo ?? ""}
                  onChange={handleInputChange}
                  className="w-full border rounded px-2 py-1 mt-1"
                />
              </div>
            )}
            {form.paymentMethod === "Zelle" && (
              <div>
                <label className="block text-sm font-semibold text-gray-600">Zelle:</label>
                <input
                  type="text"
                  name="zelle"
                  value={form.zelle ?? ""}
                  onChange={handleInputChange}
                  className="w-full border rounded px-2 py-1 mt-1"
                />
              </div>
            )}
            
            {/* Tax Form */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-600">Uploaded W9 (tax form):</label>
              {pdfUrl && (
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline text-sm"
                  >
                    Download Current W9 Form
                  </a>
                  <button
                    type="button"
                    onClick={() => handleFileDelete("taxForm")}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors ml-2"
                    title="Delete tax form"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              )}
              <FileUpload
                label="Tax Form (PDF)"
                accept="application/pdf"
                setFile={(file) => {
                  setFileInputs((prev) => ({ ...prev, taxForm: file }));
                  setFilesChanged(prev => ({ ...prev, taxForm: true }));
                }}
                required={false}
              />
            </div>
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
          setFilesChanged(prev => ({ ...prev, photo: true }));
          setShowCropModal(false);
        }}
      />
    </>
  );
}
